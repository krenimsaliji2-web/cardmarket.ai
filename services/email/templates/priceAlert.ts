import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface PriceAlertData {
  userName: string;
  cardName: string;
  targetPrice: string;
  currentPrice: string;
  cardUrl: string;
}

/** PLATZHALTER-Template – noch von keinem Feature automatisch verwendet. */
export function renderPriceAlertEmail(data: PriceAlertData): RenderedEmail {
  const subject = `Preisalarm: ${data.cardName} ist jetzt günstiger`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Dein Zielpreis wurde erreicht</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.userName)},</p>
    <p style="margin:0 0 16px 0;">
      <strong>${escapeHtml(data.cardName)}</strong> kostet aktuell
      <strong>${escapeHtml(data.currentPrice)}</strong> – dein Zielpreis war
      ${escapeHtml(data.targetPrice)}.
    </p>
    <p style="margin:0 0 16px 0;">
      <a href="${escapeHtml(data.cardUrl)}" style="display:inline-block;padding:10px 20px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:4px;">
        Karte ansehen
      </a>
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: finaler Text folgt]</p>
  `;

  const bodyText = `Dein Zielpreis wurde erreicht\n\nHallo ${data.userName},\n\n${data.cardName} kostet aktuell ${data.currentPrice} – dein Zielpreis war ${data.targetPrice}.\n\nKarte ansehen: ${data.cardUrl}\n\n[PLATZHALTER: finaler Text folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
