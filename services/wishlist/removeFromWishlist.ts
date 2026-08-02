import { prisma } from "@/lib/prisma";

export type RemoveFromWishlistResult = { status: "removed" } | { status: "not_found" };

/**
 * Entfernt eine einzelne WishlistItem-Zeile (nicht die gesamte Wishlist).
 * Ownership-Check direkt in der Query (wishlist: { userId }), gleiches
 * Muster wie services/collection/removeFromCollection.ts.
 */
export async function removeFromWishlist(
  itemId: string,
  userId: string,
): Promise<RemoveFromWishlistResult> {
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlist: { userId } },
    select: { id: true },
  });

  if (!item) {
    return { status: "not_found" };
  }

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  return { status: "removed" };
}
