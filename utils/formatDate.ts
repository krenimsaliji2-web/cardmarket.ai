/**
 * Formatiert ein Datum für die Anzeige (Standard: deutsches Format, TT.MM.JJJJ).
 */
export function formatDate(date: Date, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formatiert einen Zeitpunkt für die Chat-Anzeige (Feature 51): Uhrzeit
 * (HH:MM), falls das Datum heute ist, sonst TT.MM.JJJJ HH:MM.
 */
export function formatMessageTimestamp(date: Date, locale = "de-DE"): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);

  return isToday ? time : `${formatDate(date, locale)} ${time}`;
}
