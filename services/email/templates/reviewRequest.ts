import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface ReviewRequestData {
  buyerName: string;
  sellerName: string;
  orderId: string;
  reviewUrl: string;
}

/** PLATZHALTER-Template – noch von keinem Feature automatisch verwendet. */
export function renderReviewRequestEmail(data: ReviewRequestData): RenderedEmail {
  const subject = `Wie war dein Einkauf bei ${data.sellerName}?`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Bewerte deinen Einkauf</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.buyerName)},</p>
    <p style="margin:0 0 16px 0;">
      wie war dein Einkauf bei <strong>${escapeHtml(data.sellerName)}</strong>
      (Bestellung #${escapeHtml(data.orderId)})?
    </p>
    <p style="margin:0 0 16px 0;">
      <a href="${escapeHtml(data.reviewUrl)}" style="display:inline-block;padding:10px 20px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:4px;">
        Jetzt bewerten
      </a>
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: finaler Text folgt]</p>
  `;

  const bodyText = `Bewerte deinen Einkauf\n\nHallo ${data.buyerName},\n\nwie war dein Einkauf bei ${data.sellerName} (Bestellung #${data.orderId})?\n\nJetzt bewerten: ${data.reviewUrl}\n\n[PLATZHALTER: finaler Text folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
