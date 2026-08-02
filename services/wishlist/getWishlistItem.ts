import { prisma } from "@/lib/prisma";

export interface WishlistItemDetail {
  id: string;
  cardId: string;
  language: string;
  condition: string;
  foil: boolean;
  targetPrice: string | null;
  notes: string | null;
}

/**
 * Lädt ein einzelnes WishlistItem, streng ownership-scoped (id +
 * wishlist.userId in derselben Query) – "existiert nicht" und "gehört
 * jemand anderem" kollabieren in denselben null-Rückgabewert (gleiches
 * Muster wie services/collection/getCollectionItem.ts). Für ein
 * Bearbeiten-Formular, das mit den aktuellen Werten vorausgefüllt wird.
 */
export async function getWishlistItem(
  itemId: string,
  userId: string,
): Promise<WishlistItemDetail | null> {
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlist: { userId } },
    select: {
      id: true,
      cardId: true,
      language: true,
      condition: true,
      foil: true,
      targetPrice: true,
      notes: true,
    },
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    cardId: item.cardId,
    language: item.language,
    condition: item.condition,
    foil: item.foil,
    targetPrice: item.targetPrice?.toFixed(2) ?? null,
    notes: item.notes,
  };
}
