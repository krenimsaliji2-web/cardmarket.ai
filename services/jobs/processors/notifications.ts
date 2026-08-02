import type { Job } from "bullmq";

import { createNotification } from "@/services/notifications/createNotification";
import type { NotificationJobPayload } from "@/services/notifications/queueNotification";

/**
 * Verarbeitet NOTIFICATION-Jobs (Feature 57 – Notification Queue
 * Integration): ruft intern createNotification() auf – der einzige Ort
 * im gesamten Projekt, der diese Funktion noch aufruft. Alle Features
 * sollen stattdessen services/notifications/queueNotification.ts
 * verwenden, das die Benachrichtigung über diese Queue statt synchron
 * erzeugt.
 *
 * `metadata` aus dem Payload wird bewusst NICHT an createNotification()
 * weitergereicht (Notification-Datenmodell bleibt laut Ticket
 * unverändert, siehe queueNotification.ts).
 *
 * Fehler werden bewusst NICHT abgefangen – ein geworfener Fehler lässt
 * BullMQ den Job als fehlgeschlagen markieren und automatisch mit
 * exponentiellem Backoff erneut versuchen (3 Versuche, siehe
 * queueNotification.ts).
 */
export async function processNotificationJob(job: Job): Promise<void> {
  const payload = job.data as NotificationJobPayload;

  console.log(
    `[jobs:notifications] Verarbeite Benachrichtigungs-Job: Typ "${payload.type}" für User ${payload.userId} (Job ${job.id}).`,
  );

  const result = await createNotification({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
  });

  console.log(`[jobs:notifications] Benachrichtigung erstellt: ${result.id} (Job ${job.id}).`);
}
