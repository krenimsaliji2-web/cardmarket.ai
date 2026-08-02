import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MarketPriceWindow {
  average: string | null;
  lowest: string | null;
  highest: string | null;
  median: string | null;
  salesCount: number;
  lastSaleAt: Date | null;
}

export interface MarketPriceBreakdown {
  last7Days: MarketPriceWindow;
  last30Days: MarketPriceWindow;
  last90Days: MarketPriceWindow;
  allTime: MarketPriceWindow;
}

const EMPTY_WINDOW: MarketPriceWindow = {
  average: null,
  lowest: null,
  highest: null,
  median: null,
  salesCount: 0,
  lastSaleAt: null,
};

/**
 * Berechnet Durchschnitt/Minimum/Maximum/Median/Anzahl Verkäufe/letzter
 * Verkauf für eine Karte, aufgeschlüsselt nach 7/30/90 Tagen und
 * Gesamthistorie. Lädt alle PriceHistory-Zeilen der Karte EINMAL (indiziert
 * über cardId) und berechnet alle vier Zeitfenster daraus in JS, statt vier
 * separater DB-Aggregationen – bei den hier realistischen Datenmengen
 * (Verkäufe pro Karte, nicht Millionen Zeilen) schneller als vier
 * Roundtrips, und Median lässt sich ohnehin nicht per Prisma-Aggregate
 * berechnen.
 *
 * Durchschnitt/Minimum/Maximum/Median beziehen sich auf `averagePrice` je
 * PriceHistory-Zeile (= der tatsächliche Verkaufspreis dieser Position),
 * nicht auf soldCount-gewichtete Einzelstücke – "Anzahl Verkäufe" zählt
 * Verkaufsvorgänge (Zeilen), nicht verkaufte Stückzahl.
 */
export async function calculateMarketPrice(
  cardId: string,
  now: Date = new Date(),
): Promise<MarketPriceBreakdown> {
  const rows = await prisma.priceHistory.findMany({
    where: { cardId },
    orderBy: { createdAt: "desc" },
    select: { averagePrice: true, createdAt: true },
  });

  return {
    last7Days: computeWindow(filterByDays(rows, now, 7)),
    last30Days: computeWindow(filterByDays(rows, now, 30)),
    last90Days: computeWindow(filterByDays(rows, now, 90)),
    allTime: computeWindow(rows),
  };
}

/** Exportiert für Wiederverwendung in getPriceChartData.ts (Feature 75) – keine zweite Implementierung derselben Zeitfenster-Filterung. */
export function filterByDays<T extends { createdAt: Date }>(rows: T[], now: Date, days: number): T[] {
  const threshold = now.getTime() - days * DAY_MS;
  return rows.filter((row) => row.createdAt.getTime() >= threshold);
}

function computeWindow(rows: { averagePrice: Prisma.Decimal; createdAt: Date }[]): MarketPriceWindow {
  if (rows.length === 0) {
    return EMPTY_WINDOW;
  }

  const prices = rows.map((row) => row.averagePrice).sort((a, b) => a.comparedTo(b));
  const sum = prices.reduce((total, price) => total.plus(price), new Prisma.Decimal(0));
  const average = sum.dividedBy(prices.length);
  const median = calculateMedian(prices);
  const lastSaleAt = rows.reduce(
    (latest, row) => (row.createdAt > latest ? row.createdAt : latest),
    rows[0].createdAt,
  );

  return {
    average: average.toFixed(2),
    lowest: prices[0].toFixed(2),
    highest: prices[prices.length - 1].toFixed(2),
    median: median.toFixed(2),
    salesCount: rows.length,
    lastSaleAt,
  };
}

/** Erwartet eine bereits AUFSTEIGEND sortierte Liste. */
function calculateMedian(sortedPrices: Prisma.Decimal[]): Prisma.Decimal {
  const middle = Math.floor(sortedPrices.length / 2);

  if (sortedPrices.length % 2 === 0) {
    return sortedPrices[middle - 1].plus(sortedPrices[middle]).dividedBy(2);
  }

  return sortedPrices[middle];
}
