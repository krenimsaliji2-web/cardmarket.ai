import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface InvoiceCreatedData {
  buyerName: string;
  orderId: string;
  invoiceNumber: string;
}

/** PLATZHALTER-Template – noch von keinem Feature automatisch verwendet. */
export function renderInvoiceCreatedEmail(data: InvoiceCreatedData): RenderedEmail {
  const subject = `Deine Rechnung ${data.invoiceNumber}`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Rechnung erstellt</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.buyerName)},</p>
    <p style="margin:0 0 16px 0;">
      zu deiner Bestellung <strong>#${escapeHtml(data.orderId)}</strong> wurde die Rechnung
      <strong>${escapeHtml(data.invoiceNumber)}</strong> erstellt.
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: Rechnung als Anhang/Download-Link folgt]</p>
  `;

  const bodyText = `Rechnung erstellt\n\nHallo ${data.buyerName},\n\nzu deiner Bestellung #${data.orderId} wurde die Rechnung ${data.invoiceNumber} erstellt.\n\n[PLATZHALTER: Rechnung als Anhang/Download-Link folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
