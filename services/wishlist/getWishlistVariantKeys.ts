import { prisma } from "@/lib/prisma";

import { getOrCreateWishlist } from "./getWishlist";

export interface WishlistVariantKeyEntry {
  itemId: string;
  cardId: string;
  language: string;
  condition: string;
  foil: boolean;
}

/**
 * Lädt ALLE Wunschlisten-Varianten eines Users in einer einzigen, leichten
 * Query (nur die für den Varianten-Schlüssel nötigen Felder, kein
 * Kartenname/Marktpreis-Join wie in getWishlist.ts) – Grundlage für
 * "Favoritenstatus laden" auf Seiten mit mehreren Karten/Listings
 * gleichzeitig (z. B. /marketplace, 24 Listings pro Seite): GENAU EINE
 * Query unabhängig von der Anzahl angezeigter Karten, kein N+1.
 *
 * Aufrufer bilden daraus lokal eine Map (Schlüssel `cardId|language|
 * condition|foil`) und schlagen pro angezeigter Karte/Listing nach – siehe
 * app/marketplace/page.tsx.
 */
export async function getWishlistVariantKeys(userId: string): Promise<WishlistVariantKeyEntry[]> {
  const wishlist = await getOrCreateWishlist(userId);

  return prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    select: { id: true, cardId: true, language: true, condition: true, foil: true },
  }).then((items) =>
    items.map((item) => ({
      itemId: item.id,
      cardId: item.cardId,
      language: item.language,
      condition: item.condition,
      foil: item.foil,
    })),
  );
}

/** Baut den Lookup-Schlüssel, konsistent zwischen Server (hier) und den Konsumenten. */
export function buildWishlistVariantKey(cardId: string, language: string, condition: string, foil: boolean): string {
  return `${cardId}|${language}|${condition}|${foil}`;
}
