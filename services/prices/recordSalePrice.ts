import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

const SOURCE = "cardverse";

export interface RecordSalePriceInput {
  cardId: string;
  /** Verkaufspreis pro Einheit (Decimal-String, z. B. "12.50"). */
  price: string;
  currency: string;
  quantity: number;
  /** Verkaufsdatum; ohne Angabe wird `now()` verwendet (DB-Default). */
  soldAt?: Date;
}

export interface RecordSalePriceResult {
  id: string;
}

/**
 * Legt beim erfolgreichen Kauf (aufgerufen aus
 * services/orders/createOrder.ts, nach erfolgreichem Order-Anlegen – rein
 * additiv, analog zu updateInventory()/createInvoice() aus Feature 30/35)
 * einen PriceHistory-Eintrag für die verkaufte Karte an.
 *
 * Jeder Eintrag repräsentiert GENAU einen realen Verkauf (eine
 * OrderItem-Position): averagePrice/lowestPrice/highestPrice sind für
 * einen einzelnen Verkauf identisch (= der tatsächliche Verkaufspreis),
 * soldCount ist die verkaufte Menge dieser Position. calculateMarketPrice()
 * aggregiert später über mehrere solcher Einträge hinweg.
 */
export async function recordSalePrice(
  input: RecordSalePriceInput,
): Promise<RecordSalePriceResult> {
  const price = new Prisma.Decimal(input.price);

  return prisma.priceHistory.create({
    data: {
      cardId: input.cardId,
      currency: input.currency,
      averagePrice: price,
      lowestPrice: price,
      highestPrice: price,
      soldCount: input.quantity,
      source: SOURCE,
      ...(input.soldAt ? { createdAt: input.soldAt } : {}),
    },
    select: { id: true },
  });
}
