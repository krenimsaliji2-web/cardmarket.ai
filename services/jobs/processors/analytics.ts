import type { Job } from "bullmq";

/**
 * Platzhalter-Processor für ANALYTICS-Jobs (Feature 55 – reine
 * Foundation). Verarbeitet noch keine echten Auswertungen –
 * services/analytics/* wird hier bewusst NICHT aufgerufen.
 */
export async function processAnalyticsJob(job: Job): Promise<void> {
  console.log(`[jobs:analytics] Platzhalter – würde Job ${job.id} verarbeiten:`, job.data);
}
