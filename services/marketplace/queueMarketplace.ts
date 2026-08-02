import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/** Ereignistyp eines Marketplace-Jobs (kein Status-Feld auf Listing für diese Ereignisse – reine Job-Semantik). */
export const MarketplaceJobType = {
  LISTING_CREATED: "LISTING_CREATED",
  LISTING_UPDATED: "LISTING_UPDATED",
  LISTING_DEACTIVATED: "LISTING_DEACTIVATED",
  LISTING_SOLD: "LISTING_SOLD",
  FEATURED: "FEATURED",
} as const;

export type MarketplaceJobType = (typeof MarketplaceJobType)[keyof typeof MarketplaceJobType];

/**
 * Payload für MARKETPLACE-Jobs (Feature 64 – Marketplace Queue
 * Integration). Bewusst HIER in services/marketplace/ definiert statt
 * in services/jobs/job-types.ts – dieselbe Begründung wie bei den
 * vorherigen Queue-Integrationen (Feature 56/57/58/60/61/62/63): die
 * generische Queue-Infrastruktur (Feature 55) soll domänen-unabhängig
 * bleiben.
 *
 * Kein separates `userId`-Feld – Empfänger einer optionalen
 * Notification/E-Mail ist bei allen fünf Ereignistypen der Verkäufer
 * des Listings (`Listing.seller.userId`, aufgelöst im Processor).
 */
export interface MarketplaceJobPayload {
  listingId: string;
  type: MarketplaceJobType;
  sendNotification?: boolean;
  sendEmail?: boolean;
}

/**
 * Reiht einen Marketplace-bezogenen Hintergrundjob über die bestehende
 * Queue (Feature 55) ein. Reine Foundation: es entsteht KEIN neues
 * Marketplace-Feature, keine UI, keine API – Marketplace/Listings/Search
 * (Feature 13/39/49) bleiben vollständig unverändert. Der Worker
 * (processMarketplace.ts) lädt das Listing nur lesend und löst optional
 * Notification/E-Mail über die bereits bestehenden Queue-Integrationen
 * aus (Feature 57/56).
 *
 * Priority ist laut Ticket immer NORMAL. Retry: Feature-55-Defaults (3
 * Versuche, exponentieller Backoff) – keine Sonderkonfiguration nötig.
 *
 * Wird aktuell von KEINEM Feature automatisch aufgerufen ("Keine
 * automatische Verwendung" laut Ticket).
 */
export async function queueMarketplace(payload: MarketplaceJobPayload): Promise<string> {
  console.log(
    `[jobs:marketplace] Queued Marketplace Job: listingId=${payload.listingId}, type=${payload.type}` +
      `${payload.sendNotification ? ", sendNotification=true" : ""}` +
      `${payload.sendEmail ? ", sendEmail=true" : ""} (Priorität NORMAL).`,
  );

  return enqueue(JobType.MARKETPLACE, payload as unknown as JobPayload, { priority: JobPriority.NORMAL });
}
