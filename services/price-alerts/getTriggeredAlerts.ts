import { checkPriceAlerts, type TriggeredAlert } from "./checkPriceAlerts";

/**
 * Lädt die ausgelösten Preisalarme für die Anzeige – ruft checkPriceAlerts()
 * auf und sortiert nach Ersparnis absteigend (Standard-Sortierung laut
 * Anforderung). Prüfung und Sortierung bewusst getrennt, damit Erstere
 * unabhängig von der Sortierung getestet werden kann (gleiches Muster wie
 * services/portfolio/getPortfolio.ts).
 */
export async function getTriggeredAlerts(userId: string): Promise<TriggeredAlert[]> {
  const alerts = await checkPriceAlerts(userId);

  return [...alerts].sort((a, b) => Number(b.difference) - Number(a.difference));
}
