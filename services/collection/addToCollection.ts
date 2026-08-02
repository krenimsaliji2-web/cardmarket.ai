import { prisma } from "@/lib/prisma";

import { getOrCreateCollection } from "./getCollection";

export interface AddToCollectionInput {
  userId: string;
  cardId: string;
  quantity: number;
  language: string;
  condition: string;
  foil?: boolean;
  purchasePrice?: string;
  estimatedValue?: string;
  notes?: string;
}

export interface AddToCollectionResult {
  id: string;
  quantity: number;
}

/**
 * Fügt eine Karte zur Collection des Users hinzu. Existiert dieselbe
 * "Variante" (Karte + Sprache + Zustand + Foil, siehe
 * @@unique([collectionId, cardId, language, condition, foil]) in
 * prisma/schema.prisma) bereits, wird nur die Menge erhöht statt eine
 * zweite Zeile anzulegen – analog zu services/cart/addToCart.ts.
 */
export async function addToCollection(
  input: AddToCollectionInput,
): Promise<AddToCollectionResult> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Die Menge muss mindestens 1 sein.");
  }

  const collection = await getOrCreateCollection(input.userId);
  const foil = input.foil ?? false;

  const existing = await prisma.collectionItem.findUnique({
    where: {
      collectionId_cardId_language_condition_foil: {
        collectionId: collection.id,
        cardId: input.cardId,
        language: input.language,
        condition: input.condition,
        foil,
      },
    },
    select: { id: true, quantity: true },
  });

  if (existing) {
    return prisma.collectionItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + input.quantity },
      select: { id: true, quantity: true },
    });
  }

  return prisma.collectionItem.create({
    data: {
      collectionId: collection.id,
      cardId: input.cardId,
      quantity: input.quantity,
      language: input.language,
      condition: input.condition,
      foil,
      purchasePrice: input.purchasePrice,
      estimatedValue: input.estimatedValue,
      notes: input.notes,
    },
    select: { id: true, quantity: true },
  });
}
