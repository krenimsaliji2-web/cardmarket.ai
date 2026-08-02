import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

import { filterByDays } from "./calculateMarketPrice";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PriceChartPoint {
  /** Kalendertag (UTC, YYYY-MM-DD) – ein Punkt pro Tag mit mindestens einem Verkauf. */
  date: string;
  averagePrice: string;
  salesCount: number;
}

export interface PriceChartData {
  last7Days: PriceChartPoint[];
  last30Days: PriceChartPoint[];
  last90Days: PriceChartPoint[];
}

/** UTC-Kalendertag als "YYYY-MM-DD" – stabil unabhängig von der Serverzeitzone. */
function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Fasst PriceHistory-Zeilen zu einem Diagrammpunkt pro Kalendertag zusammen
 * (mehrere Verkäufe am selben Tag -> ein Punkt). Durchschnitt pro Tag wird
 * exakt wie in calculateMarketPrice.ts's computeWindow() als einfaches
 * arithmetisches Mittel über `averagePrice` je Zeile berechnet (keine nach
 * soldCount gewichtete Zweitberechnung – dieselbe Konvention, keine zweite
 * Preislogik).
 */
function buildDailySeries(rows: { averagePrice: Prisma.Decimal; createdAt: Date }[]): PriceChartPoint[] {
  const byDay = new Map<string, Prisma.Decimal[]>();

  for (const row of rows) {
    const key = toDayKey(row.createdAt);
    const existing = byDay.get(key);
    if (existing) {
      existing.push(row.averagePrice);
    } else {
      byDay.set(key, [row.averagePrice]);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => {
      const sum = prices.reduce((total, price) => total.plus(price), new Prisma.Decimal(0));
      return {
        date,
        averagePrice: sum.dividedBy(prices.length).toFixed(2),
        salesCount: prices.length,
      };
    });
}

/**
 * Bereitet Diagrammdaten (ein Punkt pro Kalendertag) für die Preisverlauf-
 * Anzeige einer Karte auf, aufgeschlüsselt nach 7/30/90 Tagen. Lädt die
 * PriceHistory-Zeilen der letzten 90 Tage GENAU EINMAL (derselbe indizierte
 * Query-Zuschnitt wie calculateMarketPrice.ts: cardId + createdAt, siehe
 * @@index([cardId, createdAt]) in prisma/schema.prisma) und leitet alle drei
 * Zeitfenster daraus in JS ab – keine drei separaten DB-Roundtrips, kein N+1.
 *
 * Reine Lesefunktion, keine neue Preislogik: verwendet ausschließlich
 * bestehende PriceHistory-Daten (recordSalePrice.ts, Feature 30) und dieselbe
 * Durchschnittsberechnung wie calculateMarketPrice.ts.
 */
export async function getPriceChartData(
  cardId: string,
  now: Date = new Date(),
): Promise<PriceChartData> {
  const since90Days = new Date(now.getTime() - 90 * DAY_MS);

  const rows = await prisma.priceHistory.findMany({
    where: { cardId, createdAt: { gte: since90Days } },
    orderBy: { createdAt: "asc" },
    select: { averagePrice: true, createdAt: true },
  });

  return {
    last7Days: buildDailySeries(filterByDays(rows, now, 7)),
    last30Days: buildDailySeries(filterByDays(rows, now, 30)),
    // rows ist bereits durch die Query auf 90 Tage begrenzt – kein zweiter Filterdurchlauf nötig.
    last90Days: buildDailySeries(rows),
  };
}
