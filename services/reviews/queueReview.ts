import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/**
 * Payload für REVIEW-Jobs (Feature 61 – Review Queue Integration).
 * Bewusst HIER in services/reviews/ definiert statt in
 * services/jobs/job-types.ts – dieselbe Begründung wie bei
 * services/email/queueEmail.ts (Feature 56), services/notifications/
 * queueNotification.ts (Feature 57), services/price-alerts/
 * queuePriceAlertCheck.ts (Feature 58) und services/catalog/
 * queueCatalogImport.ts (Feature 60): die generische Queue-
 * Infrastruktur (Feature 55) soll domänen-unabhängig bleiben.
 *
 * `userId` ist der Empfänger einer optionalen Notification/E-Mail (nicht
 * zwingend der Käufer oder Verkäufer der Review – das entscheidet der
 * Aufrufer). `sellerProfileId` ist Kontext für den Aufrufer/künftige
 * Erweiterungen, wird vom Processor nicht zur Autorisierung genutzt
 * (reine Foundation, keine automatische Verwendung).
 */
export interface ReviewJobPayload {
  reviewId: string;
  userId: string;
  sellerProfileId: string;
  sendNotification?: boolean;
  sendEmail?: boolean;
}

/**
 * Reiht einen Review-bezogenen Hintergrundjob über die bestehende Queue
 * (Feature 55) ein. Reine Foundation: Es wird KEINE neue Review-Funktion
 * eingeführt, die bestehende Review-Logik (services/reviews/{createReview,
 * getReview,getSellerRating,getSellerReviews}.ts) bleibt vollständig
 * unverändert – der Worker (processReview.ts) lädt die Review nur
 * lesend und löst optional Notification/E-Mail über die bereits
 * bestehenden Queue-Integrationen aus (Feature 57/56).
 *
 * Priority ist laut Ticket immer NORMAL. Retry: Feature-55-Defaults (3
 * Versuche, exponentieller Backoff) – keine Sonderkonfiguration nötig.
 *
 * Wird aktuell von KEINEM Feature automatisch aufgerufen ("Keine
 * automatische Verwendung" laut Ticket).
 */
export async function queueReview(payload: ReviewJobPayload): Promise<string> {
  console.log(
    `[jobs:review] Queued Review Job: reviewId=${payload.reviewId}, userId=${payload.userId}, ` +
      `sellerProfileId=${payload.sellerProfileId}` +
      `${payload.sendNotification ? ", sendNotification=true" : ""}` +
      `${payload.sendEmail ? ", sendEmail=true" : ""} (Priorität NORMAL).`,
  );

  return enqueue(JobType.REVIEW, payload as unknown as JobPayload, { priority: JobPriority.NORMAL });
}
