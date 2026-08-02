import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/** Ereignistyp eines Seller-Jobs (kein Status-Feld auf SellerProfile – reine Job-Ereignisse). */
export const SellerJobType = {
  PROFILE_UPDATED: "PROFILE_UPDATED",
  FOLLOWED: "FOLLOWED",
  UNFOLLOWED: "UNFOLLOWED",
  VERIFIED: "VERIFIED",
  SHOP_RULES_UPDATED: "SHOP_RULES_UPDATED",
} as const;

export type SellerJobType = (typeof SellerJobType)[keyof typeof SellerJobType];

/**
 * Payload für SELLER-Jobs (Feature 63 – Seller Queue Integration).
 * Bewusst HIER in services/seller/ definiert statt in
 * services/jobs/job-types.ts – dieselbe Begründung wie bei den
 * vorherigen Queue-Integrationen (Feature 56/57/58/60/61/62): die
 * generische Queue-Infrastruktur (Feature 55) soll domänen-unabhängig
 * bleiben.
 *
 * Anders als bei Feature 61/62 gibt es hier bewusst KEIN separates
 * `userId`-Feld für den Benachrichtigungs-Empfänger – Empfänger ist bei
 * allen fünf Ereignistypen immer der Verkäufer selbst
 * (`SellerProfile.userId`, aufgelöst im Processor über
 * getPublicSellerProfile()).
 */
export interface SellerJobPayload {
  sellerProfileId: string;
  type: SellerJobType;
  sendNotification?: boolean;
  sendEmail?: boolean;
}

/**
 * Reiht einen Seller-bezogenen Hintergrundjob über die bestehende Queue
 * (Feature 55) ein. Reine Foundation: es entsteht KEIN neues Seller-
 * Feature, kein neues Profil, keine neue UI – die bestehende Seller-
 * Logik (services/seller/{createSellerProfile,getPublicSellerProfile,
 * getSellerDashboard,updateSellerProfile}.ts) und das Follow-System
 * (Feature 53) bleiben vollständig unverändert. Der Worker
 * (processSeller.ts) lädt das SellerProfile nur lesend und löst optional
 * Notification/E-Mail über die bereits bestehenden Queue-Integrationen
 * aus (Feature 57/56).
 *
 * Priority ist laut Ticket immer NORMAL. Retry: Feature-55-Defaults (3
 * Versuche, exponentieller Backoff) – keine Sonderkonfiguration nötig.
 *
 * Wird aktuell von KEINEM Feature automatisch aufgerufen ("Keine
 * automatische Verwendung" laut Ticket).
 */
export async function queueSeller(payload: SellerJobPayload): Promise<string> {
  console.log(
    `[jobs:seller] Queued Seller Job: sellerProfileId=${payload.sellerProfileId}, type=${payload.type}` +
      `${payload.sendNotification ? ", sendNotification=true" : ""}` +
      `${payload.sendEmail ? ", sendEmail=true" : ""} (Priorität NORMAL).`,
  );

  return enqueue(JobType.SELLER, payload as unknown as JobPayload, { priority: JobPriority.NORMAL });
}
