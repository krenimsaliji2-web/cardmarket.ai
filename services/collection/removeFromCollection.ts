import { prisma } from "@/lib/prisma";

export type RemoveFromCollectionResult = { status: "removed" } | { status: "not_found" };

/**
 * Entfernt eine einzelne CollectionItem-Zeile (nicht die gesamte
 * Collection). Ownership-Check direkt in der Query (collection: { userId }),
 * gleiches Muster wie services/cart/removeFromCart.ts.
 */
export async function removeFromCollection(
  itemId: string,
  userId: string,
): Promise<RemoveFromCollectionResult> {
  const item = await prisma.collectionItem.findFirst({
    where: { id: itemId, collection: { userId } },
    select: { id: true },
  });

  if (!item) {
    return { status: "not_found" };
  }

  await prisma.collectionItem.delete({ where: { id: item.id } });
  return { status: "removed" };
}
