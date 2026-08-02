/**
 * Formatiert einen Decimal-Preis (als String, z. B. von Prisma) auf zwei
 * Nachkommastellen. Kein Währungssymbol, da Listing aktuell keine Währung
 * speichert.
 */
export function formatPrice(value: string): string {
  return Number(value).toFixed(2);
}
