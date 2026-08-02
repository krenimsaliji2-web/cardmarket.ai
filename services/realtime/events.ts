/**
 * Zentrale Event-Definitionen der Echtzeit-Infrastruktur (Feature 54 –
 * WebSocket Foundation). Reine Definitionen – wird von KEINEM Feature
 * benutzt/ausgelöst, das ist bewusst spätere Arbeit ("Nur definieren.
 * Nicht benutzen." laut Ticket).
 */
export const RealtimeEvent = {
  CHAT_MESSAGE: "CHAT_MESSAGE",
  NOTIFICATION: "NOTIFICATION",
  PRICE_ALERT: "PRICE_ALERT",
  NEW_ORDER: "NEW_ORDER",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  SELLER_FOLLOWED: "SELLER_FOLLOWED",
  MARKETPLACE_UPDATE: "MARKETPLACE_UPDATE",
} as const;

export type RealtimeEvent = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

/**
 * Umschlag, in dem jedes Event über den Socket verschickt wird. `payload`
 * ist bewusst generisch (`unknown`) statt pro Event domänenspezifisch
 * typisiert – eine konkrete Payload-Form pro Event würde Importe aus den
 * jeweiligen Fach-Services erzwingen (Chat/Notifications/Price Alerts/
 * Orders/Follow/Marketplace) und damit genau die Kopplung einführen, die
 * dieses Foundation-Feature laut Ticket noch nicht herstellen soll.
 */
export interface RealtimeMessage<TPayload = unknown> {
  event: RealtimeEvent;
  payload: TPayload;
  sentAt: string;
}
