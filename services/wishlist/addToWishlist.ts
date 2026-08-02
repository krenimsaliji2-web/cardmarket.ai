import { prisma } from "@/lib/prisma";

import { getOrCreateWishlist } from "./getWishlist";
import { getWishlistItemByVariant } from "./getWishlistItemByVariant";

export interface AddToWishlistInput {
  userId: string;
  cardId: string;
  language: string;
  condition: string;
  foil?: boolean;
  targetPrice?: string;
  notes?: string;
}

export interface AddToWishlistResult {
  id: string;
  alreadyExisted: boolean;
}

/**
 * Fügt eine Karte zur Wishlist des Users hinzu. Anders als
 * addToCollection() gibt es hier KEINE Menge, die erhöht werden könnte:
 * existiert dieselbe "Variante" (Karte + Sprache + Zustand + Foil, siehe
 * @@unique([wishlistId, cardId, language, condition, foil])) bereits, ist
 * addToWishlist() ein No-Op (idempotent) – es entsteht keine zweite Zeile
 * und bestehende Werte (targetPrice/notes) werden NICHT überschrieben; dafür
 * gibt es updateWishlistItem().
 */
export async function addToWishlist(input: AddToWishlistInput): Promise<AddToWishlistResult> {
  const wishlist = await getOrCreateWishlist(input.userId);
  const foil = input.foil ?? false;

  const existing = await getWishlistItemByVariant(
    input.userId,
    { cardId: input.cardId, language: input.language, condition: input.condition, foil },
    wishlist.id,
  );

  if (existing) {
    return { id: existing.id, alreadyExisted: true };
  }

  const created = await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      cardId: input.cardId,
      language: input.language,
      condition: input.condition,
      foil,
      targetPrice: input.targetPrice,
      notes: input.notes,
    },
    select: { id: true },
  });

  return { id: created.id, alreadyExisted: false };
}
