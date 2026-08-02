import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface OrderConfirmationData {
  buyerName: string;
  orderId: string;
  totalPrice: string;
  currency: string;
}

/**
 * PLATZHALTER-Template – noch keine finale Kopie/kein finales Layout der
 * Positionsliste. Wird noch von keinem Feature automatisch aufgerufen
 * (siehe services/orders/createOrder.ts, dort bewusst nicht verdrahtet).
 */
export function renderOrderConfirmationEmail(data: OrderConfirmationData): RenderedEmail {
  const subject = `Bestellbestätigung – Bestellung #${data.orderId}`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Danke für deine Bestellung!</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.buyerName)},</p>
    <p style="margin:0 0 16px 0;">
      wir haben deine Bestellung <strong>#${escapeHtml(data.orderId)}</strong> über
      <strong>${escapeHtml(data.totalPrice)} ${escapeHtml(data.currency.toUpperCase())}</strong> erhalten.
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: Positionsliste folgt]</p>
  `;

  const bodyText = `Danke für deine Bestellung!\n\nHallo ${data.buyerName},\n\nwir haben deine Bestellung #${data.orderId} über ${data.totalPrice} ${data.currency.toUpperCase()} erhalten.\n\n[PLATZHALTER: Positionsliste folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
