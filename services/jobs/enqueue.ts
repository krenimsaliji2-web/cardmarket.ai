import type { JobsOptions } from "bullmq";

import { JobPriority, type JobPayload, type JobType } from "./job-types";
import { jobQueue } from "./queue";

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_DELAY_MS = 5000;

export interface EnqueueOptions {
  priority?: JobPriority;
  /** Anzahl Versuche insgesamt (inkl. des ersten) – Default 3. */
  attempts?: number;
  /** Basis-Verzögerung für den exponentiellen Backoff zwischen Retries (ms) – Default 5000. */
  backoffDelayMs?: number;
}

function buildJobOptions(options: EnqueueOptions = {}): JobsOptions {
  return {
    priority: options.priority ?? JobPriority.NORMAL,
    attempts: options.attempts ?? DEFAULT_ATTEMPTS,
    // Exponential Backoff, konfigurierbar über backoffDelayMs (Ticket: "Retry: Exponential Backoff konfigurierbar").
    backoff: {
      type: "exponential",
      delay: options.backoffDelayMs ?? DEFAULT_BACKOFF_DELAY_MS,
    },
    // Verhindert unbegrenztes Wachstum der Job-Historie in Redis.
    removeOnComplete: { age: 24 * 60 * 60 },
    removeOnFail: { age: 7 * 24 * 60 * 60 },
  };
}

/** Reiht einen Job sofort zur Verarbeitung ein. Liefert die BullMQ-Job-ID. */
export async function enqueue(
  type: JobType,
  payload: JobPayload,
  options?: EnqueueOptions,
): Promise<string> {
  const job = await jobQueue.add(type, payload, buildJobOptions(options));
  return job.id!;
}

/** Wie enqueue(), verarbeitet den Job aber erst nach `delayMs` Millisekunden. */
export async function enqueueDelayed(
  type: JobType,
  payload: JobPayload,
  delayMs: number,
  options?: EnqueueOptions,
): Promise<string> {
  const job = await jobQueue.add(type, payload, { ...buildJobOptions(options), delay: delayMs });
  return job.id!;
}

/**
 * Verhindert doppelte Jobs mit demselben `dedupeKey`: BullMQ nutzt die
 * `jobId` zur Deduplizierung – ein zweiter add() mit derselben ID wird
 * ignoriert (liefert den bereits vorhandenen Job zurück), solange der
 * erste Job noch nicht abgeschlossen/entfernt wurde.
 */
export async function enqueueUnique(
  type: JobType,
  payload: JobPayload,
  dedupeKey: string,
  options?: EnqueueOptions,
): Promise<string> {
  const job = await jobQueue.add(type, payload, { ...buildJobOptions(options), jobId: dedupeKey });
  return job.id!;
}

/** Entfernt einen noch nicht abgeschlossenen Job aus der Queue. Liefert `false`, falls er nicht (mehr) existiert. */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await jobQueue.getJob(jobId);
  if (!job) {
    return false;
  }
  await job.remove();
  return true;
}

export type JobStatus =
  | "completed"
  | "failed"
  | "delayed"
  | "active"
  | "waiting"
  | "waiting-children"
  | "prioritized"
  | "unknown"
  | "not_found";

/** Liefert den aktuellen Status eines Jobs (BullMQ-State), oder "not_found". */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const job = await jobQueue.getJob(jobId);
  if (!job) {
    return "not_found";
  }
  return (await job.getState()) as JobStatus;
}
