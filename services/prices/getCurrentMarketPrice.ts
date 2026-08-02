import { calculateMarketPrice, type MarketPriceBreakdown } from "./calculateMarketPrice";

export type MarketPriceTrend = "up" | "down" | "stable" | "unknown";

export interface CurrentMarketPriceResult {
  currentPrice: string | null;
  average: string | null;
  lowest: string | null;
  highest: string | null;
  sales: number;
  lastSale: Date | null;
  trend: MarketPriceTrend;
}

/** Ab welcher relativen Abweichung (%) zwischen 7-Tage- und 30-Tage-Durchschnitt als "up"/"down" statt "stable" gilt. */
const TREND_THRESHOLD_PERCENT = 5;

/**
 * Liefert den "aktuellen Marktpreis" einer Karte als flache, einfach zu
 * konsumierende Sicht auf calculateMarketPrice(). `currentPrice` ist der
 * Durchschnitt des kürzesten Zeitfensters mit tatsächlichen Verkäufen
 * (7 Tage bevorzugt, sonst 30/90 Tage, sonst Gesamthistorie) – "der Preis,
 * den die Karte gerade tatsächlich erzielt". `average`/`lowest`/`highest`/
 * `sales`/`lastSale` beziehen sich auf die Gesamthistorie.
 */
export async function getCurrentMarketPrice(cardId: string): Promise<CurrentMarketPriceResult> {
  const breakdown = await calculateMarketPrice(cardId);

  const currentWindow =
    breakdown.last7Days.salesCount > 0
      ? breakdown.last7Days
      : breakdown.last30Days.salesCount > 0
        ? breakdown.last30Days
        : breakdown.last90Days.salesCount > 0
          ? breakdown.last90Days
          : breakdown.allTime;

  return {
    currentPrice: currentWindow.average,
    average: breakdown.allTime.average,
    lowest: breakdown.allTime.lowest,
    highest: breakdown.allTime.highest,
    sales: breakdown.allTime.salesCount,
    lastSale: breakdown.allTime.lastSaleAt,
    trend: calculateTrend(breakdown),
  };
}

/**
 * Vergleicht den 7-Tage- mit dem 30-Tage-Durchschnitt. Fehlen in einem der
 * beiden Fenster Verkäufe, ist kein verlässlicher Trend bestimmbar ->
 * "unknown".
 */
function calculateTrend(breakdown: MarketPriceBreakdown): MarketPriceTrend {
  const recent = breakdown.last7Days.average;
  const baseline = breakdown.last30Days.average;

  if (!recent || !baseline) {
    return "unknown";
  }

  const recentValue = Number(recent);
  const baselineValue = Number(baseline);
  const changePercent = ((recentValue - baselineValue) / baselineValue) * 100;

  if (changePercent > TREND_THRESHOLD_PERCENT) {
    return "up";
  }
  if (changePercent < -TREND_THRESHOLD_PERCENT) {
    return "down";
  }
  return "stable";
}
