import { calculatePortfolio, type PortfolioResult } from "./calculatePortfolio";

/**
 * Lädt das Portfolio für die Anzeige – ruft calculatePortfolio() auf und
 * sortiert die Positionen nach Gesamtwert absteigend (Standard-Sortierung
 * laut Anforderung). Die eigentliche Berechnung lebt bewusst in
 * calculatePortfolio.ts, damit sie unabhängig von der Sortierung getestet
 * werden kann.
 */
export async function getPortfolio(userId: string): Promise<PortfolioResult> {
  const portfolio = await calculatePortfolio(userId);

  return {
    ...portfolio,
    positions: [...portfolio.positions].sort(
      (a, b) => Number(b.totalMarketValue) - Number(a.totalMarketValue),
    ),
  };
}
