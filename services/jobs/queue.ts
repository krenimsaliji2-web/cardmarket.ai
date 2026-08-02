import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Einzige Redis-Verbindung der gesamten Queue-Infrastruktur ("Keine
 * zweite Redis-Verbindung aufbauen" laut Ticket) – queue.ts UND
 * worker.ts importieren ausschließlich diese eine Instanz, nie eine
 * eigene `new IORedis(...)`.
 *
 * `maxRetriesPerRequest: null` ist von BullMQ zwingend vorgeschrieben
 * (siehe BullMQ-Dokumentation) – ohne diese Option kann der Worker
 * blockierende Redis-Befehle (BRPOPLPUSH etc.) nicht korrekt ausführen.
 */
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Verbindungsfehler dürfen den Prozess nicht crashen (Node wirft bei einem
// 'error'-Event ohne Listener sonst unhandled) – z. B. wenn Redis (noch)
// nicht erreichbar ist. Sichtbares Logging statt stillem Schlucken.
redisConnection.on("error", (error) => {
  console.error("[jobs] Redis-Verbindungsfehler:", error.message);
});

/** Name der zentralen BullMQ-Queue – bewusst EINE Queue für alle Jobtypen (siehe worker.ts, das per job.name dispatcht). */
export const QUEUE_NAME = "atlas-jobs";

export const jobQueue = new Queue(QUEUE_NAME, { connection: redisConnection });
