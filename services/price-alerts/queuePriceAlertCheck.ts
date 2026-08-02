import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/**
 * Payload für PRICE_ALERT-Jobs (Feature 58 – Price Alert Queue
 * Integration). Bewusst HIER in services/price-alerts/ definiert statt
 * in services/jobs/job-types.ts – dieselbe Begründung wie bei
 * services/email/queueEmail.ts (Feature 56) und services/notifications/
 * queueNotification.ts (Feature 57): die generische Queue-
 * Infrastruktur (Feature 55) soll domänen-unabhängig bleiben.
 *
 * Alle drei Felder sind optional – fehlen sie vollständig, führt der
 * Worker (services/jobs/processors/price-alerts.ts) einen vollständigen
 * Scan über alle User mit gesetztem Zielpreis durch (siehe
 * queueFullPriceScan.ts).
 */
export interface PriceAlertJobPayload {
  userId?: string;
  cardId?: string;
  wishlistItemId?: string;
  priority?: JobPriority;
}

export interface QueuePriceAlertCheckInput {
  userId: string;
  /** Optionale Eingrenzung auf eine bestimmte Karte innerhalb der Wishlist des Users. */
  cardId?: string;
  /** Optionale Eingrenzung auf eine bestimmte WishlistItem-Position. */
  wishlistItemId?: string;
}

/**
 * Reiht eine gezielte Preisalarm-Prüfung für EINEN User (optional weiter
 * eingegrenzt auf eine Karte/WishlistItem-Position) über die Queue ein.
 * Der Worker ruft dabei intern checkPriceAlerts() auf und reicht
 * ausgelöste Alarme an queueNotification() weiter (Feature 57) – es
 * wird KEINE Notification mehr direkt erstellt.
 *
 * Retry: 3 Versuche mit exponentiellem Backoff – identisch zu den
 * Defaults aus services/jobs/enqueue.ts, keine Sonderkonfiguration
 * nötig. Priority ist laut Ticket immer NORMAL.
 */
export async function queuePriceAlertCheck(input: QueuePriceAlertCheckInput): Promise<string> {
  const payload: PriceAlertJobPayload = {
    userId: input.userId,
    cardId: input.cardId,
    wishlistItemId: input.wishlistItemId,
  };

  console.log(
    `[jobs:price-alerts] Preisalarm-Prüfung eingereiht für User ${input.userId}` +
      `${input.cardId ? `, Karte ${input.cardId}` : ""}` +
      `${input.wishlistItemId ? `, WishlistItem ${input.wishlistItemId}` : ""} (Priorität NORMAL).`,
  );

  return enqueue(JobType.PRICE_ALERT, payload as unknown as JobPayload, { priority: JobPriority.NORMAL });
}
