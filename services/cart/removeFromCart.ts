import { prisma } from "@/lib/prisma";

export type RemoveFromCartResult =
  | { status: "removed" }
  | { status: "error"; reason: "not_found" };

/**
 * Entfernt eine CartItem-Zeile. Der Ownership-Check läuft direkt in der
 * Query (cart: { userId }) – ein User kann so nur eigene Warenkorb-Einträge
 * löschen, unabhängig davon, welche cartItemId übergeben wird.
 */
export async function removeFromCart(
  userId: string,
  cartItemId: string,
): Promise<RemoveFromCartResult> {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
    select: { id: true },
  });

  if (!cartItem) {
    return { status: "error", reason: "not_found" };
  }

  await prisma.cartItem.delete({ where: { id: cartItem.id } });
  return { status: "removed" };
}
