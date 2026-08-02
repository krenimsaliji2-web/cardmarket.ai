import type { Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";
import { queueNotification } from "@/services/notifications/queueNotification";

import { getOrder } from "./getOrder";
import { OrderJobType, type OrderJobPayload } from "./queueOrder";

/** Anzeigetext je Ereignistyp – für Notification-Titel/-Nachricht (Käufer-Sicht). */
const TYPE_LABEL: Record<OrderJobType, string> = {
  [OrderJobType.CREATED]: "Bestellung eingegangen",
  [OrderJobType.PAID]: "Bestellung bezahlt",
  [OrderJobType.SHIPPED]: "Bestellung versendet",
  [OrderJobType.DELIVERED]: "Bestellung geliefert",
  [OrderJobType.CANCELLED]: "Bestellung storniert",
};

/** Anzeigetext je Ereignistyp – für Notification-Titel/-Nachricht (Verkäufer-Sicht, Feature 73). */
const SELLER_TYPE_LABEL: Record<OrderJobType, string> = {
  [OrderJobType.CREATED]: "Neue Bestellung erhalten",
  [OrderJobType.PAID]: "Neue Bestellung erhalten",
  [OrderJobType.SHIPPED]: "Bestellung versendet",
  [OrderJobType.DELIVERED]: "Bestellung geliefert",
  [OrderJobType.CANCELLED]: "Bestellung storniert",
};

/**
 * Verarbeitet ORDER-Jobs (Feature 62 – Order Queue Integration, seit
 * Feature 73 erstmals produktiv über createOrder() ausgelöst). Lädt die
 * bestehende Order nur LESEND über das bereits vorhandene getOrder()
 * (Feature 35, ownership-scoped über buyerId – exakt dieselbe Prüfung,
 * die auch der Payload liefert) – keine Änderung an der Order, keine
 * Statusänderung, keine Datenbankänderung. Löst optional die bereits
 * bestehenden Queue-Integrationen aus: queueNotification() (Feature 57)
 * und queueTemplateEmail() (Feature 56) – für den Käufer über
 * sendNotification/sendEmail, für den Verkäufer über
 * sendSellerNotification (Feature 73, siehe queueOrder.ts).
 *
 * E-Mail-Template je Typ: PAID nutzt `invoiceCreated` (semantisch
 * naheliegend – Zahlung löst eine Rechnung aus; die Rechnungsnummer
 * folgt exakt der bereits etablierten Konvention `RE-{orderId}` aus
 * services/invoices/createInvoice.ts, OHNE diese Funktion selbst
 * aufzurufen – sie erzeugt eine echte PDF-Datei, ein Seiteneffekt, den
 * diese reine Foundation nicht auslösen darf). CREATED/SHIPPED/
 * DELIVERED/CANCELLED nutzen `orderConfirmation` als generischen
 * Platzhalter, da kein passenderes bestehendes Template existiert und
 * keine neuen Templates angelegt werden dürfen – eine künftige, echte
 * Verwendung dieser Foundation kann pro Typ ein treffenderes Template
 * wählen.
 *
 * Fehlerbehandlung exakt wie im Ticket gefordert: KEIN try/catch. Eine
 * ungültige `orderId` (oder eine `buyerId`, die nicht zur Order passt –
 * getOrder() ist ownership-scoped) wirft eine Exception – BullMQ
 * markiert den Job dadurch als fehlgeschlagen und übernimmt den Retry
 * (3 Versuche, exponentieller Backoff, Feature-55-Defaults).
 */
export async function processOrder(job: Job): Promise<void> {
  const payload = job.data as OrderJobPayload;

  console.log(
    `[jobs:order] Started Order Job (Job ${job.id}): orderId=${payload.orderId}, type=${payload.type}.`,
  );

  if (!payload.orderId || !payload.buyerId || !payload.sellerId || !payload.type) {
    throw new Error("Ungültiger Order-Job: orderId/buyerId/sellerId/type fehlen.");
  }

  const order = await getOrder(payload.orderId, payload.buyerId);

  if (!order) {
    throw new Error(`Unknown Order: "${payload.orderId}"`);
  }

  if (payload.sendNotification) {
    await queueNotification({
      userId: payload.buyerId,
      type: NotificationType.ORDER,
      title: TYPE_LABEL[payload.type],
      message: `${TYPE_LABEL[payload.type]}: Bestellung #${order.id}.`,
      link: `/orders/${order.id}`,
    });
  }

  // Feature 73 – "Verkäufer benachrichtigen": unabhängig von
  // sendNotification (das ausschließlich den Käufer betrifft, siehe
  // queueOrder.ts). Kein Wurf, falls das SellerProfile nicht (mehr)
  // existiert – analog zum fehlenden E-Mail-Empfänger unten.
  if (payload.sendSellerNotification) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: payload.sellerId },
      select: { userId: true },
    });

    if (seller) {
      await queueNotification({
        userId: seller.userId,
        type: NotificationType.ORDER,
        title: SELLER_TYPE_LABEL[payload.type],
        message: `${SELLER_TYPE_LABEL[payload.type]}: Bestellung #${order.id}.`,
        link: `/seller/orders/${order.id}`,
      });
    }
  }

  if (payload.sendEmail) {
    const buyer = await prisma.user.findUnique({
      where: { id: payload.buyerId },
      select: { name: true, email: true },
    });

    // Kein Wurf, falls der Empfänger nicht (mehr) existiert – "Ungültige
    // orderId" ist laut Ticket der einzige explizit geforderte Fehlerfall;
    // ein fehlender E-Mail-Empfänger überspringt den Versand still.
    if (buyer) {
      if (payload.type === OrderJobType.PAID) {
        await queueTemplateEmail({
          template: "invoiceCreated",
          to: buyer.email,
          data: { buyerName: buyer.name, orderId: order.id, invoiceNumber: `RE-${order.id}` },
        });
      } else {
        await queueTemplateEmail({
          template: "orderConfirmation",
          to: buyer.email,
          data: { buyerName: buyer.name, orderId: order.id, totalPrice: order.totalPrice, currency: order.currency },
        });
      }
    }
  }

  console.log(`[jobs:order] Finished Order Job (Job ${job.id}).`);
}
