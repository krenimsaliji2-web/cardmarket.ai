import { NotificationType } from "@/prisma/generated/prisma/client";
import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/**
 * Payload für NOTIFICATION-Jobs (Feature 57 – Notification Queue
 * Integration). Bewusst HIER in services/notifications/ definiert statt
 * in services/jobs/job-types.ts – dieselbe Begründung wie bei
 * services/email/queueEmail.ts (Feature 56): die generische Queue-
 * Infrastruktur (Feature 55) soll domänen-unabhängig bleiben, jede
 * Queue-Integration bekommt ihre eigene Payload-Form in ihrem eigenen
 * Service-Ordner.
 *
 * `metadata` ist NICHT Teil des Notification-Datenmodells (Ticket:
 * "Nicht verändern: Notification Datenmodell") – wird bewusst NICHT an
 * createNotification() weitergereicht/gespeichert, sondern nur im
 * Job-Payload mitgeführt (z. B. für Logging oder künftige, in diesem
 * Feature nicht implementierte Erweiterungen).
 */
export interface NotificationJobPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  priority?: JobPriority;
}

/** Standard-Priorität je Notification-Typ (siehe Ticket-Tabelle) – ein expliziter `priority`-Wert im Payload überschreibt diese Vorgabe. */
const TYPE_PRIORITY: Record<NotificationType, JobPriority> = {
  [NotificationType.SYSTEM]: JobPriority.HIGH,
  [NotificationType.ORDER]: JobPriority.HIGH,
  [NotificationType.MESSAGE]: JobPriority.HIGH,
  [NotificationType.PRICE_ALERT]: JobPriority.NORMAL,
  [NotificationType.REVIEW]: JobPriority.LOW,
  [NotificationType.ADMIN]: JobPriority.LOW,
};

const PRIORITY_LABEL: Record<JobPriority, string> = {
  [JobPriority.CRITICAL]: "CRITICAL",
  [JobPriority.HIGH]: "HIGH",
  [JobPriority.NORMAL]: "NORMAL",
  [JobPriority.LOW]: "LOW",
};

/**
 * Reiht eine Benachrichtigung zur asynchronen Erzeugung über die Queue
 * (Feature 55) ein, statt sie synchron zu erzeugen. Der Worker
 * (services/jobs/processors/notifications.ts) verarbeitet den Job und
 * ruft dabei intern createNotification() auf – das ist jetzt der
 * einzige Erzeugungsweg; kein Feature soll createNotification() mehr
 * direkt aufrufen.
 *
 * Retry: 3 Versuche mit exponentiellem Backoff – identisch zu den
 * Defaults aus services/jobs/enqueue.ts, keine Sonderkonfiguration nötig
 * (Ticket: "3 Versuche, Exponential Backoff").
 */
export async function queueNotification(payload: NotificationJobPayload): Promise<string> {
  const priority = payload.priority ?? TYPE_PRIORITY[payload.type];
  const fullPayload: NotificationJobPayload = { ...payload, priority };

  console.log(
    `[jobs:notifications] Benachrichtigung eingereiht: Typ "${payload.type}" für User ${payload.userId} ` +
      `(Priorität ${PRIORITY_LABEL[priority]}).`,
  );

  return enqueue(JobType.NOTIFICATION, fullPayload as unknown as JobPayload, { priority });
}
