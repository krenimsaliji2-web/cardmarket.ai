import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { clearCart } from "@/services/cart/clearCart";
import { getCart } from "@/services/cart/getCart";
import { createInvoice } from "@/services/invoices/createInvoice";
import { updateInventory } from "@/services/inventory/updateInventory";
import { createConversation } from "@/services/messages/createConversation";
import { OrderJobType, queueOrder } from "@/services/orders/queueOrder";
import { recordSalePrice } from "@/services/prices/recordSalePrice";

export type CreateOrderResult =
  | { status: "created"; orderId: string }
  | { status: "already_exists"; orderId: string }
  | { status: "error"; reason: "missing_user" | "empty_cart" };

const ENQUEUE_TIMEOUT_MS = 5000;

/**
 * Begrenzt die Wartezeit auf enqueue()/queueOrder() auf ENQUEUE_TIMEOUT_MS.
 * Nötig, weil ein try/catch allein NICHT vor einem nicht erreichbaren Redis
 * schützt: ioredis (maxRetriesPerRequest: null, siehe services/jobs/queue.ts)
 * retried einen einzelnen Befehl unbegrenzt im Hintergrund, das Promise
 * würde also nie ablehnen, sondern für immer hängen bleiben – ohne dieses
 * Timeout würde die Webhook-Antwort an Stripe nie zurückkommen.
 */
function withEnqueueTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Job-Queue nicht erreichbar (Timeout nach ${ENQUEUE_TIMEOUT_MS}ms).`)),
        ENQUEUE_TIMEOUT_MS,
      ),
    ),
  ]);
}

/**
 * Erstellt aus einer erfolgreich abgeschlossenen Stripe Checkout Session
 * eine Order inkl. OrderItems (unveränderlicher Snapshot der aktuellen
 * Warenkorb-/Listing-Daten, siehe prisma/schema.prisma), erzeugt danach
 * über createInvoice() die PDF-Rechnung, zeichnet über recordSalePrice()
 * pro Position einen Preisverlaufs-Eintrag auf, reduziert über
 * updateInventory() den Bestand der gekauften Listings (deaktiviert das
 * Listing automatisch, sobald die Menge 0 erreicht), leert den Warenkorb
 * über clearCart() und löst zuletzt Käufer-Bestätigung sowie
 * Verkäufer-Benachrichtigung über die bestehende Job-Queue aus
 * (queueOrder(), Feature 62/73 – Notification + E-Mail). Erstellt außerdem
 * über die bestehende createConversation() (Feature 41, siehe
 * services/messages/) automatisch einen Chat zwischen Käufer und jedem
 * beteiligten Verkäufer – oder verwendet den bereits vorhandenen weiter
 * (Feature 74 – Käufer-/Verkäufer-Chat).
 *
 * Idempotent über stripeCheckoutSessionId: Stripe stellt Webhook-Events
 * "at least once" zu, ein doppelt zugestelltes Event darf weder eine
 * zweite Order noch eine zweite Bestandsreduktion, Rechnung,
 * Preisverlaufs-Zeile oder Benachrichtigung auslösen. createInvoice()/
 * recordSalePrice()/updateInventory()/queueOrder() werden deshalb
 * ausschließlich auf dem "created"-Pfad aufgerufen, nie beim
 * "already_exists"-Pfad – ein zweiter, eigener Idempotenz-Mechanismus in
 * einem der vier ist bewusst nicht vorhanden.
 */
export async function createOrder(session: Stripe.Checkout.Session): Promise<CreateOrderResult> {
  const userId = session.client_reference_id;

  if (!userId) {
    console.warn(
      `checkout.session.completed ohne client_reference_id erhalten (session ${session.id}).`,
    );
    return { status: "error", reason: "missing_user" };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    select: { id: true },
  });

  if (existingOrder) {
    return { status: "already_exists", orderId: existingOrder.id };
  }

  const cart = await getCart(userId);

  if (cart.items.length === 0) {
    console.warn(
      `checkout.session.completed für leeren Warenkorb erhalten (session ${session.id}, user ${userId}).`,
    );
    return { status: "error", reason: "empty_cart" };
  }

  const totalPrice = cart.items.reduce(
    (sum, item) => sum.plus(new Prisma.Decimal(item.subtotal)),
    new Prisma.Decimal(0),
  );

  const currency = session.currency ?? "chf";

  // Race-Condition-sicher nach demselben Muster wie
  // services/messages/createConversation.ts: Stripe stellt Webhook-Events
  // "at least once" zu, zwei nahezu gleichzeitige Zustellungen desselben
  // Events können beide den obigen findUnique()-Check passieren, bevor
  // eine der beiden das order.create() committet hat. Der zweite Versuch
  // verletzt dann den Unique-Index auf stripeCheckoutSessionId (P2002) –
  // statt das unbehandelt als 500 an Stripe zurückzugeben (und damit einen
  // unnötigen Retry auszulösen), wird die inzwischen von der anderen
  // Zustellung angelegte Order erneut geladen.
  let order: { id: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId,
          stripeCheckoutSessionId: session.id,
          totalPrice: totalPrice.toFixed(2),
          currency,
          items: {
            create: cart.items.map((item) => ({
              listingId: item.listingId,
              sellerId: item.sellerId,
              cardName: item.cardName,
              cardImage: item.cardImage,
              sellerName: item.sellerName,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.subtotal,
              language: item.language,
              condition: item.condition,
            })),
          },
        },
        select: { id: true },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingAfterRace = await prisma.order.findUnique({
        where: { stripeCheckoutSessionId: session.id },
        select: { id: true },
      });
      if (existingAfterRace) {
        return { status: "already_exists", orderId: existingAfterRace.id };
      }
    }
    throw error;
  }

  await createInvoice(order.id);

  // recordSalePrice() braucht cardId, das (bewusst, siehe Feature 29) kein
  // Snapshot-Feld auf OrderItem ist – wird hier über die bestehende
  // Listing-Relation der bereits geladenen Warenkorb-Positionen aufgelöst,
  // ohne OrderItem/Order selbst zu verändern.
  const listings = await prisma.listing.findMany({
    where: { id: { in: [...new Set(cart.items.map((item) => item.listingId))] } },
    select: { id: true, cardId: true },
  });
  const cardIdByListingId = new Map(listings.map((listing) => [listing.id, listing.cardId]));

  for (const item of cart.items) {
    const cardId = cardIdByListingId.get(item.listingId);
    if (cardId) {
      await recordSalePrice({
        cardId,
        price: item.price,
        currency,
        quantity: item.quantity,
      });
    }
  }

  await updateInventory(order.id);
  await clearCart(userId);

  const uniqueSellerIds = [...new Set(cart.items.map((item) => item.sellerId))];

  // Chat zwischen Käufer und jedem beteiligten Verkäufer automatisch
  // anlegen (oder den bereits bestehenden weiterverwenden – createConversation()
  // ist bereits idempotent über @@unique([buyerId, sellerId]), siehe dort).
  // Kein Timeout nötig (reine Postgres-Operation, kein Redis) – trotzdem in
  // try/catch: ein Chat ist ein Zusatznutzen nach der bereits erfolgreichen
  // Zahlung, ihr Fehlschlagen darf die Order-Erstellung nicht rückgängig
  // machen oder die Webhook-Antwort blockieren.
  try {
    for (const sellerId of uniqueSellerIds) {
      const firstItemForSeller = cart.items.find((item) => item.sellerId === sellerId);
      await createConversation({
        buyerId: userId,
        sellerId,
        listingId: firstItemForSeller?.listingId,
      });
    }
  } catch (error) {
    console.error(
      `[orders] Chat für Order ${order.id} konnte nicht erstellt werden:`,
      error instanceof Error ? error.message : error,
    );
  }

  // Käufer-Bestätigung (Notification + E-Mail) genau einmal pro Order,
  // Verkäufer-Benachrichtigung einmal pro beteiligtem Verkäufer (ein
  // Warenkorb kann Listings mehrerer Seller enthalten) – siehe
  // OrderJobPayload.sendSellerNotification-Kommentar in queueOrder.ts.
  //
  // Bewusst in try/catch UND mit Timeout begrenzt (withEnqueueTimeout): der
  // kritische Pfad (Order/Invoice/Inventar, alles oben bereits committed)
  // darf durch einen Ausfall der Job-Queue (z. B. Redis nicht erreichbar)
  // niemals blockiert werden. Benachrichtigung ist hier ein Best-Effort-
  // Seiteneffekt einer bereits erfolgreichen Zahlung, kein Teil der
  // Zahlungsbestätigung selbst.
  try {
    await withEnqueueTimeout(
      queueOrder({
        orderId: order.id,
        buyerId: userId,
        sellerId: uniqueSellerIds[0],
        type: OrderJobType.PAID,
        sendNotification: true,
        sendEmail: true,
      }),
    );

    for (const sellerId of uniqueSellerIds) {
      await withEnqueueTimeout(
        queueOrder({
          orderId: order.id,
          buyerId: userId,
          sellerId,
          type: OrderJobType.PAID,
          sendSellerNotification: true,
        }),
      );
    }
  } catch (error) {
    console.error(
      `[orders] Benachrichtigung für Order ${order.id} konnte nicht eingereiht werden:`,
      error instanceof Error ? error.message : error,
    );
  }

  return { status: "created", orderId: order.id };
}
