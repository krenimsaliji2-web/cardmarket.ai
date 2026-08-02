import { prisma } from "@/lib/prisma";

import { InsufficientInventoryError } from "./errors";

/**
 * Reduziert den Bestand aller Listings einer Order um die jeweils
 * gekaufte Menge (OrderItem.quantity). Wird ausschließlich von
 * createOrder() aufgerufen, nachdem eine NEUE Order angelegt wurde (siehe
 * services/orders/createOrder.ts) – die Idempotenz gegenüber doppelt
 * zugestellten Webhook-Events kommt bereits von dort über die
 * stripeCheckoutSessionId-Eindeutigkeit; hier gibt es bewusst KEINEN
 * zweiten Idempotenz-Mechanismus.
 *
 * Erreicht ein Listing dabei Menge 0, wird es automatisch deaktiviert
 * (isActive = false), sonst bleibt/wird es aktiv. Würde die Menge negativ
 * werden (z. B. durch eine parallele Bestellung), wird die gesamte
 * Transaktion über InsufficientInventoryError abgebrochen statt still auf 0
 * zu kappen – ein negativer Bestand darf nie in die DB geschrieben werden.
 *
 * Die Reduktion selbst läuft als ein einziges atomares `updateMany()` mit
 * `quantity: { gte: item.quantity }` im WHERE (SQL: `quantity = quantity -
 * X WHERE id = ? AND quantity >= X`) statt per read-then-write
 * (findUnique → update): Zwei nahezu gleichzeitige Bestellungen desselben
 * Listings (zwei parallele Stripe-Webhooks) könnten sonst beide denselben
 * quantity-Wert lesen, bevor eine der beiden ihr update() committet hat –
 * ein klassisches "Lost Update", das Bestand über den tatsächlichen Stand
 * hinaus verkaufen würde. Die atomare Variante lässt Postgres die
 * Bedingung gegen den jeweils aktuellen (gesperrten) Zeilenwert prüfen.
 */
export async function updateInventory(orderId: string): Promise<void> {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: { listingId: true, quantity: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
      const { count } = await tx.listing.updateMany({
        where: { id: item.listingId, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });

      if (count === 0) {
        throw new InsufficientInventoryError(item.listingId);
      }

      const listing = await tx.listing.findUniqueOrThrow({
        where: { id: item.listingId },
        select: { quantity: true },
      });

      if (listing.quantity === 0) {
        await tx.listing.update({
          where: { id: item.listingId },
          data: { isActive: false },
        });
      }
    }
  });
}
