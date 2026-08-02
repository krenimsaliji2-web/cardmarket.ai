import { prisma } from "@/lib/prisma";

export interface UpdateCollectionItemInput {
  quantity: number;
  language: string;
  condition: string;
  foil: boolean;
  notes?: string | null;
  purchasePrice?: string | null;
}

export type UpdateCollectionItemResult = { status: "updated" } | { status: "not_found" };

/**
 * Aktualisiert Menge/Sprache/Zustand/Foil/Notizen/Kaufpreis eines
 * CollectionItems. Ownership-Check wie removeFromCollection(). Ändert der
 * User Sprache/Zustand/Foil so, dass die Kombination mit einer anderen
 * bereits vorhandenen Zeile kollidiert (@@unique-Constraint), schlägt der
 * Aufruf bewusst fehl statt die Zeilen automatisch zusammenzuführen – ein
 * seltener Randfall, der nicht Teil dieser Foundation ist.
 */
export async function updateCollectionItem(
  itemId: string,
  userId: string,
  input: UpdateCollectionItemInput,
): Promise<UpdateCollectionItemResult> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Die Menge muss mindestens 1 sein.");
  }

  const item = await prisma.collectionItem.findFirst({
    where: { id: itemId, collection: { userId } },
    select: { id: true },
  });

  if (!item) {
    return { status: "not_found" };
  }

  await prisma.collectionItem.update({
    where: { id: item.id },
    data: {
      quantity: input.quantity,
      language: input.language,
      condition: input.condition,
      foil: input.foil,
      notes: input.notes ?? null,
      purchasePrice: input.purchasePrice ?? null,
    },
  });

  return { status: "updated" };
}
