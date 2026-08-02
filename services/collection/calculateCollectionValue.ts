import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getCurrentMarketPrice } from "@/services/prices/getCurrentMarketPrice";

import { getOrCreateCollection } from "./getCollection";

export interface CollectionItemValue {
  collectionItemId: string;
  cardId: string;
  quantity: number;
  /** Marktwert pro Einheit (null, falls für diese Karte noch keine Verkaufsdaten vorliegen). */
  marketPrice: string | null;
  /** marketPrice × quantity (0.00, falls kein Marktpreis verfügbar). */
  totalValue: string;
}

export interface CollectionValueResult {
  totalValue: string;
  totalCardCount: number;
  uniqueCardCount: number;
  averageCardValue: string;
  items: CollectionItemValue[];
}

/**
 * Berechnet den Sammlungswert. Nutzt ausschließlich getCurrentMarketPrice()
 * aus Feature 39 für die Preisermittlung – keine eigene/doppelte
 * Preislogik. purchasePrice/estimatedValue (Kaufpreis, vom User gepflegt)
 * fließen hier bewusst NICHT ein, nur der aktuelle Marktpreis.
 *
 * "Anzahl unterschiedlicher Karten" zählt DISTINCT cardId (dieselbe Karte
 * in mehreren Sprachen/Zuständen zählt als eine Karte); "Gesamtanzahl
 * Karten" ist die Summe aller quantity-Werte.
 */
export async function calculateCollectionValue(userId: string): Promise<CollectionValueResult> {
  const collection = await getOrCreateCollection(userId);

  const items = await prisma.collectionItem.findMany({
    where: { collectionId: collection.id },
    select: { id: true, cardId: true, quantity: true },
  });

  const marketPrices = await Promise.all(
    items.map((item) => getCurrentMarketPrice(item.cardId)),
  );

  let totalValue = new Prisma.Decimal(0);
  let totalCardCount = 0;
  const itemValues: CollectionItemValue[] = [];

  items.forEach((item, index) => {
    const currentPrice = marketPrices[index].currentPrice;
    const unitPrice = currentPrice ? new Prisma.Decimal(currentPrice) : new Prisma.Decimal(0);
    const itemTotal = unitPrice.times(item.quantity);

    totalValue = totalValue.plus(itemTotal);
    totalCardCount += item.quantity;

    itemValues.push({
      collectionItemId: item.id,
      cardId: item.cardId,
      quantity: item.quantity,
      marketPrice: currentPrice,
      totalValue: itemTotal.toFixed(2),
    });
  });

  const uniqueCardCount = new Set(items.map((item) => item.cardId)).size;
  const averageCardValue =
    totalCardCount === 0 ? new Prisma.Decimal(0) : totalValue.dividedBy(totalCardCount);

  return {
    totalValue: totalValue.toFixed(2),
    totalCardCount,
    uniqueCardCount,
    averageCardValue: averageCardValue.toFixed(2),
    items: itemValues,
  };
}
