import type { Job } from "bullmq";

/**
 * Platzhalter-Processor für IMAGE_PROCESSING-Jobs (Feature 55 – reine
 * Foundation). Verarbeitet noch keine echten Bilder – services/storage/*
 * wird hier bewusst NICHT aufgerufen.
 */
export async function processImageProcessingJob(job: Job): Promise<void> {
  console.log(`[jobs:image-processing] Platzhalter – würde Job ${job.id} verarbeiten:`, job.data);
}
