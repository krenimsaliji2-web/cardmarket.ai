import { prisma } from "@/lib/prisma";

export type MarkDeliveredResult =
  | { status: "delivered"; deliveredAt: Date }
  | { status: "not_found" }
  | { status: "not_shipped" };

/**
 * Setzt `deliveredAt` für eine Bestellposition. Ownership wie in
 * updateShipment.ts (ausschließlich über das eigene SellerProfile).
 * Erfordert einen bereits gesetzten `shippedAt` – eine Position kann
 * nicht als geliefert gelten, bevor sie überhaupt als versendet markiert
 * wurde (`status: "not_shipped"`).
 */
export async function markDelivered(
  userId: string,
  orderItemId: string,
): Promise<MarkDeliveredResult> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!sellerProfile) {
    return { status: "not_found" };
  }

  const existing = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId: sellerProfile.id },
    select: { shippedAt: true },
  });

  if (!existing) {
    return { status: "not_found" };
  }

  if (!existing.shippedAt) {
    return { status: "not_shipped" };
  }

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { deliveredAt: new Date() },
    select: { deliveredAt: true },
  });

  return { status: "delivered", deliveredAt: updated.deliveredAt! };
}
