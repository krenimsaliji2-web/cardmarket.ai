import { prisma } from "@/lib/prisma";

export interface CollectionItemDetail {
  id: string;
  cardId: string;
  quantity: number;
  language: string;
  condition: string;
  foil: boolean;
  purchasePrice: string | null;
  notes: string | null;
}

/**
 * Lädt ein einzelnes CollectionItem, streng ownership-scoped (id +
 * collection.userId in derselben Query) – "existiert nicht" und "gehört
 * jemand anderem" kollabieren in denselben null-Rückgabewert (gleiches
 * Muster wie services/listing/*, services/orders/getOrder.ts). Für ein
 * Bearbeiten-Formular, das mit den aktuellen Werten vorausgefüllt wird.
 */
export async function getCollectionItem(
  itemId: string,
  userId: string,
): Promise<CollectionItemDetail | null> {
  const item = await prisma.collectionItem.findFirst({
    where: { id: itemId, collection: { userId } },
    select: {
      id: true,
      cardId: true,
      quantity: true,
      language: true,
      condition: true,
      foil: true,
      purchasePrice: true,
      notes: true,
    },
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    cardId: item.cardId,
    quantity: item.quantity,
    language: item.language,
    condition: item.condition,
    foil: item.foil,
    purchasePrice: item.purchasePrice?.toFixed(2) ?? null,
    notes: item.notes,
  };
}
