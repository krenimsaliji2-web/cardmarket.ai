import { fileURLToPath } from "node:url";

import { Worker, type Job } from "bullmq";

import { processCatalogImport } from "@/services/catalog/processCatalogImport";
import { processMarketplace } from "@/services/marketplace/processMarketplace";
import { processOrder } from "@/services/orders/processOrder";
import { processReview } from "@/services/reviews/processReview";
import { processSeller } from "@/services/seller/processSeller";

import { JobType } from "./job-types";
import { processAnalyticsJob } from "./processors/analytics";
import { processEmailJob } from "./processors/email";
import { processImageProcessingJob } from "./processors/image-processing";
import { processNotificationJob } from "./processors/notifications";
import { processPriceAlertJob } from "./processors/price-alerts";
import { QUEUE_NAME, redisConnection } from "./queue";

const DEFAULT_CONCURRENCY = 5;

type Processor = (job: Job) => Promise<void>;

/**
 * Dispatch-Tabelle Jobtyp -> Processor. EXPORT/SYNC sind laut Ticket nur
 * definierte Jobtypen (job-types.ts), aber (noch) OHNE Processor-Datei –
 * bewusst kein Platzhalter-Eintrag hier, damit ein Job dieses Typs mit
 * einer klaren Fehlermeldung fehlschlägt statt still zu verschwinden.
 */
const processors: Partial<Record<JobType, Processor>> = {
  [JobType.EMAIL]: processEmailJob,
  [JobType.NOTIFICATION]: processNotificationJob,
  [JobType.PRICE_ALERT]: processPriceAlertJob,
  [JobType.IMAGE_PROCESSING]: processImageProcessingJob,
  [JobType.ANALYTICS]: processAnalyticsJob,
  // Feature 60 – Catalog Import Queue Integration. Processor liegt bewusst
  // in services/catalog/ statt in ./processors/ (siehe processCatalogImport.ts).
  [JobType.CATALOG_IMPORT]: processCatalogImport,
  // Feature 61 – Review Queue Integration. Processor liegt bewusst in
  // services/reviews/ statt in ./processors/ (siehe processReview.ts).
  [JobType.REVIEW]: processReview,
  // Feature 62 – Order Queue Integration. Processor liegt bewusst in
  // services/orders/ statt in ./processors/ (siehe processOrder.ts).
  [JobType.ORDER]: processOrder,
  // Feature 63 – Seller Queue Integration. Processor liegt bewusst in
  // services/seller/ statt in ./processors/ (siehe processSeller.ts).
  [JobType.SELLER]: processSeller,
  // Feature 64 – Marketplace Queue Integration. Processor liegt bewusst
  // in services/marketplace/ statt in ./processors/ (siehe processMarketplace.ts).
  [JobType.MARKETPLACE]: processMarketplace,
};

async function dispatch(job: Job): Promise<void> {
  const processor = processors[job.name as JobType];

  if (!processor) {
    throw new Error(`Kein Processor für Jobtyp "${job.name}" registriert.`);
  }

  await processor(job);
}

export interface StartWorkerOptions {
  concurrency?: number;
}

/**
 * Startet den zentralen Job-Worker (eine BullMQ-Queue, ein Worker,
 * Dispatch per job.name an den passenden Platzhalter-Processor).
 * Concurrency ist konfigurierbar (Parameter oder ENV
 * `JOBS_WORKER_CONCURRENCY`, sonst Default 5) – Performance-Anforderung
 * "Worker Concurrency konfigurierbar".
 *
 * Logging deckt "Job Started"/"Job Finished"/"Job Failed" inkl. Retry-
 * Anzahl (`job.attemptsMade`) ab, wie im Ticket gefordert.
 */
export function startWorker(options: StartWorkerOptions = {}): Worker {
  const concurrency =
    options.concurrency ?? (Number(process.env.JOBS_WORKER_CONCURRENCY) || DEFAULT_CONCURRENCY);

  const worker = new Worker(QUEUE_NAME, dispatch, {
    connection: redisConnection,
    concurrency,
  });

  worker.on("active", (job) => {
    console.log(`[jobs] Job gestartet: ${job.name} (${job.id})`);
  });

  worker.on("completed", (job) => {
    console.log(`[jobs] Job abgeschlossen: ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[jobs] Job fehlgeschlagen: ${job?.name ?? "unbekannt"} (${job?.id ?? "?"}), ` +
        `Versuch ${job?.attemptsMade ?? "?"}/${job?.opts.attempts ?? "?"} – ${error.message}`,
    );
  });

  return worker;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const worker = startWorker();
  console.log(`Job-Worker gestartet (Concurrency: ${worker.opts.concurrency}).`);
}
