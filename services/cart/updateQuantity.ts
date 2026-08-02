import { prisma } from "@/lib/prisma";

export type UpdateQuantityResult =
  | { status: "updated"; quantity: number }
  | { status: "error"; reason: "not_found" | "invalid_quantity" };

/**
 * Ändert die Menge einer CartItem-Zeile. Wird auf Listing.quantity gekappt,
 * damit nie mehr im Warenkorb liegt, als tatsächlich verfügbar ist.
 */
export async function updateQuantity(
  userId: string,
  cartItemId: string,
  quantity: number,
): Promise<UpdateQuantityResult> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { status: "error", reason: "invalid_quantity" };
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
    select: { id: true, listing: { select: { quantity: true } } },
  });

  if (!cartItem) {
    return { status: "error", reason: "not_found" };
  }

  const clampedQuantity = Math.min(quantity, cartItem.listing.quantity);

  const updated = await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity: clampedQuantity },
  });

  return { status: "updated", quantity: updated.quantity };
}
