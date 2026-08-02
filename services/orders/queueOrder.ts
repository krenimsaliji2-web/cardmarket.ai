import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/** Ereignistyp eines Order-Jobs – Order selbst hat kein Status-Feld (siehe Feature 29/34), dies sind reine Job-Ereignisse. */
export const OrderJobType = {
  CREATED: "CREATED",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderJobType = (typeof OrderJobType)[keyof typeof OrderJobType];

/**
 * Payload für ORDER-Jobs (Feature 62 – Order Queue Integration). Bewusst
 * HIER in services/orders/ definiert statt in services/jobs/job-types.ts
 * – dieselbe Begründung wie bei services/email/queueEmail.ts (Feature
 * 56), services/notifications/queueNotification.ts (Feature 57),
 * services/price-alerts/queuePriceAlertCheck.ts (Feature 58),
 * services/catalog/queueCatalogImport.ts (Feature 60) und
 * services/reviews/queueReview.ts (Feature 61): die generische Queue-
 * Infrastruktur (Feature 55) soll domänen-unabhängig bleiben.
 *
 * `sendNotification`/`sendEmail` sind im Ticket-Prosatext ("optional
 * queueNotification() / optional queueTemplateEmail()") beschrieben,
 * aber nicht explizit in der Payload-Feldliste aufgeführt – hier analog
 * zu services/reviews/queueReview.ts (Feature 61) als optionale
 * Steuer-Flags ergänzt, da ohne sie die geforderte Optionalität pro
 * Aufruf nicht ausdrückbar wäre.
 *
 * `sendSellerNotification` (Feature 73 – Checkout & Stripe Connect):
 * `sendNotification`/`sendEmail` betreffen ausschließlich den Käufer
 * (`payload.buyerId`, siehe processOrder.ts). Ein Kaufabschluss betrifft
 * aber ZWEI Parteien – der Verkäufer (`payload.sellerId`) muss ebenfalls
 * benachrichtigt werden ("Verkäufer benachrichtigen" laut Ticket). Bewusst
 * ein eigenes, unabhängiges Flag statt sendNotification wiederzuverwenden:
 * eine Order kann mehrere Verkäufer umfassen (Cart mit Listings
 * unterschiedlicher Seller) – der Aufrufer (createOrder.ts) ruft
 * queueOrder() daher pro Order GENAU EINMAL mit sendNotification/sendEmail
 * (Käufer-Bestätigung) und zusätzlich EINMAL PRO beteiligtem Verkäufer mit
 * sendSellerNotification auf. Getrennte Flags verhindern, dass der Käufer
 * bei mehreren Verkäufern mehrfach benachrichtigt/gemailt wird.
 */
export interface OrderJobPayload {
  orderId: string;
  buyerId: string;
  sellerId: string;
  type: OrderJobType;
  sendNotification?: boolean;
  sendEmail?: boolean;
  sendSellerNotification?: boolean;
}

/**
 * Reiht einen Order-bezogenen Hintergrundjob über die bestehende Queue
 * (Feature 55) ein. Reine Foundation: es entsteht KEINE neue Checkout-
 * oder Payment-Logik, die bestehenden Order-Abläufe (services/orders/
 * {createOrder,getOrder,getOrders,getSellerOrders}.ts) bleiben
 * vollständig unverändert – der Worker (processOrder.ts) lädt die Order
 * nur lesend und löst optional Notification/E-Mail über die bereits
 * bestehenden Queue-Integrationen aus (Feature 57/56).
 *
 * Priority ist laut Ticket immer HIGH. Retry: Feature-55-Defaults (3
 * Versuche, exponentieller Backoff) – keine Sonderkonfiguration nötig.
 *
 * Wird aktuell von KEINEM Feature automatisch aufgerufen ("Keine
 * automatische Verwendung" laut Ticket).
 */
export async function queueOrder(payload: OrderJobPayload): Promise<string> {
  console.log(
    `[jobs:order] Queued Order Job: orderId=${payload.orderId}, type=${payload.type}, ` +
      `buyerId=${payload.buyerId}, sellerId=${payload.sellerId}` +
      `${payload.sendNotification ? ", sendNotification=true" : ""}` +
      `${payload.sendEmail ? ", sendEmail=true" : ""} (Priorität HIGH).`,
  );

  return enqueue(JobType.ORDER, payload as unknown as JobPayload, { priority: JobPriority.HIGH });
}
