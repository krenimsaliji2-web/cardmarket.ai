import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

import type { PriceAlertJobPayload } from "./queuePriceAlertCheck";

/**
 * Reiht einen vollständigen Preisalarm-Scan über die Queue ein – ein
 * PRICE_ALERT-Job OHNE Payload (siehe queuePriceAlertCheck.ts:
 * PriceAlertJobPayload, alle Felder optional). Der Worker
 * (services/jobs/processors/price-alerts.ts) erkennt den leeren Payload
 * und prüft dann ALLE User mit gesetztem Zielpreis statt nur einen.
 *
 * "Nicht implementieren: Kein Scheduler, keine Cronjobs, keine
 * automatische Ausführung" (Ticket) – diese Funktion reiht den Scan nur
 * EINMALIG ein, wenn sie aufgerufen wird; sie plant nichts periodisch.
 */
export async function queueFullPriceScan(): Promise<string> {
  const payload: PriceAlertJobPayload = {};

  console.log("[jobs:price-alerts] Vollständiger Preisalarm-Scan eingereiht (kein Payload -> alle User, Priorität NORMAL).");

  return enqueue(JobType.PRICE_ALERT, payload as unknown as JobPayload, { priority: JobPriority.NORMAL });
}
