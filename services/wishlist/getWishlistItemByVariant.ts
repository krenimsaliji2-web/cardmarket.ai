import { prisma } from "@/lib/prisma";

import { getOrCreateWishlist } from "./getWishlist";

export interface WishlistVariantKey {
  cardId: string;
  language: string;
  condition: string;
  foil: boolean;
}

/**
 * Sucht ein WishlistItem anhand der fachlichen Variante (Karte + Sprache +
 * Zustand + Foil, siehe @@unique([wishlistId, cardId, language, condition,
 * foil]) in prisma/schema.prisma) statt anhand seiner eigenen id. Dient
 * zwei Zwecken:
 * 1. Wiederverwendet von addToWishlist.ts für dessen Idempotenz-Prüfung
 *    (keine doppelte Lookup-Logik).
 * 2. Feature 77 – Favoriten: "Favoritenstatus laden" für ein einzelnes
 *    Herzsymbol (z. B. Kartendetailseite) sowie Grundlage für
 *    toggleFavoriteAction() (app/my-wishlist/actions.ts), das anhand des
 *    Ergebnisses entscheidet, ob hinzugefügt oder entfernt wird.
 */
export async function getWishlistItemByVariant(
  userId: string,
  variant: WishlistVariantKey,
  /** Optional: bereits bekannte Wishlist-id, um einen zweiten getOrCreateWishlist()-Roundtrip zu sparen (siehe addToWishlist.ts). */
  wishlistId?: string,
): Promise<{ id: string } | null> {
  const resolvedWishlistId = wishlistId ?? (await getOrCreateWishlist(userId)).id;

  return prisma.wishlistItem.findUnique({
    where: {
      wishlistId_cardId_language_condition_foil: {
        wishlistId: resolvedWishlistId,
        cardId: variant.cardId,
        language: variant.language,
        condition: variant.condition,
        foil: variant.foil,
      },
    },
    select: { id: true },
  });
}
