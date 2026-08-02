import { prisma } from "@/lib/prisma";

export interface UpdateWishlistItemInput {
  language: string;
  condition: string;
  foil: boolean;
  targetPrice?: string | null;
  notes?: string | null;
}

export type UpdateWishlistItemResult = { status: "updated" } | { status: "not_found" };

/**
 * Aktualisiert Sprache/Zustand/Foil/Zielpreis/Notizen eines WishlistItems.
 * Ownership-Check wie removeFromWishlist(). Ändert der User Sprache/
 * Zustand/Foil so, dass die Kombination mit einer anderen bereits
 * vorhandenen Zeile kollidiert (@@unique-Constraint), schlägt der Aufruf
 * bewusst fehl statt automatisch zusammenzuführen – gleiche, dokumentierte
 * Randfall-Entscheidung wie services/collection/updateCollectionItem.ts.
 */
export async function updateWishlistItem(
  itemId: string,
  userId: string,
  input: UpdateWishlistItemInput,
): Promise<UpdateWishlistItemResult> {
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlist: { userId } },
    select: { id: true },
  });

  if (!item) {
    return { status: "not_found" };
  }

  await prisma.wishlistItem.update({
    where: { id: item.id },
    data: {
      language: input.language,
      condition: input.condition,
      foil: input.foil,
      targetPrice: input.targetPrice ?? null,
      notes: input.notes ?? null,
    },
  });

  return { status: "updated" };
}
