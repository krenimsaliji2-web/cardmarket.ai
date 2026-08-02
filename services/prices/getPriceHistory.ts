import { prisma } from "@/lib/prisma";

export interface PriceHistoryEntry {
  id: string;
  currency: string;
  averagePrice: string;
  lowestPrice: string;
  highestPrice: string;
  soldCount: number;
  source: string;
  createdAt: Date;
}

export interface GetPriceHistoryOptions {
  /** Begrenzt die Anzahl zurückgegebener Einträge (neueste zuerst). */
  limit?: number;
  /** Nur Einträge ab diesem Zeitpunkt. */
  since?: Date;
}

/**
 * Lädt die einzelnen Preisverlaufs-Einträge einer Karte, neueste zuerst –
 * für die Anzeige einer Verkaufshistorie. Für aggregierte Kennzahlen siehe
 * calculateMarketPrice()/getCurrentMarketPrice().
 */
export async function getPriceHistory(
  cardId: string,
  options: GetPriceHistoryOptions = {},
): Promise<PriceHistoryEntry[]> {
  const entries = await prisma.priceHistory.findMany({
    where: {
      cardId,
      ...(options.since ? { createdAt: { gte: options.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.limit,
    select: {
      id: true,
      currency: true,
      averagePrice: true,
      lowestPrice: true,
      highestPrice: true,
      soldCount: true,
      source: true,
      createdAt: true,
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    currency: entry.currency,
    averagePrice: entry.averagePrice.toFixed(2),
    lowestPrice: entry.lowestPrice.toFixed(2),
    highestPrice: entry.highestPrice.toFixed(2),
    soldCount: entry.soldCount,
    source: entry.source,
    createdAt: entry.createdAt,
  }));
}
