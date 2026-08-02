import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

import type { EmailAttachment } from "./sendEmail";
import type { TemplateEmailInput } from "./sendTemplateEmail";

/** Verteilt eine Vereinigung über `T`, benennt `to`→`recipient` und `data`→`templateData` um. */
type RenamedTemplateFields<T> = T extends { template: infer Tpl; to: string; data: infer D }
  ? { recipient: string; template: Tpl; templateData: D }
  : never;

/**
 * Konkrete Payload-Form für EMAIL-Jobs (Feature 56 – E-Mail Queue
 * Integration). Bewusst HIER in services/email/ definiert statt in
 * services/jobs/job-types.ts: die generische Queue-Infrastruktur
 * (Feature 55) soll domänen-unabhängig bleiben. Jede künftige Queue-
 * Integration (Notifications, Price Alerts, ...) bekommt ihre eigene
 * Payload-Form in ihrem eigenen Service-Ordner statt job-types.ts
 * nach und nach mit jeder Domäne zu koppeln.
 *
 * Struktur entspricht 1:1 TemplateEmailInput (sendTemplateEmail.ts), nur
 * mit den vom Ticket geforderten Feldnamen `recipient`/`templateData`.
 */
export type EmailJobPayload = RenamedTemplateFields<TemplateEmailInput> & {
  priority?: JobPriority;
  attachments?: EmailAttachment[];
};

/** Standard-Priorität je Template (siehe Ticket-Tabelle) – ein expliziter `priority`-Wert im Payload überschreibt diese Vorgabe. */
const TEMPLATE_PRIORITY: Record<TemplateEmailInput["template"], JobPriority> = {
  passwordReset: JobPriority.CRITICAL,
  verifyEmail: JobPriority.HIGH,
  orderConfirmation: JobPriority.HIGH,
  invoiceCreated: JobPriority.NORMAL,
  reviewRequest: JobPriority.LOW,
  priceAlert: JobPriority.LOW,
  // Feature 74 – Käufer-/Verkäufer-Chat: HIGH wie verifyEmail/orderConfirmation,
  // da eine Chat-Nachricht (wie eine Notification, siehe queueNotification.ts
  // TYPE_PRIORITY[MESSAGE]) zeitnahe Relevanz für den Empfänger hat.
  newMessage: JobPriority.HIGH,
};

const PRIORITY_LABEL: Record<JobPriority, string> = {
  [JobPriority.CRITICAL]: "CRITICAL",
  [JobPriority.HIGH]: "HIGH",
  [JobPriority.NORMAL]: "NORMAL",
  [JobPriority.LOW]: "LOW",
};

/**
 * Reiht eine E-Mail zur asynchronen Zustellung über die Queue (Feature
 * 55) ein, statt sie synchron zu verschicken. Der Worker
 * (services/jobs/processors/email.ts) verarbeitet den Job und ruft dabei
 * intern sendTemplateEmail() auf – das ist jetzt der einzige Versandweg;
 * kein Feature soll sendEmail()/sendTemplateEmail() mehr direkt
 * synchron aufrufen.
 *
 * Retry: 3 Versuche mit exponentiellem Backoff – identisch zu den
 * Defaults aus services/jobs/enqueue.ts, keine Sonderkonfiguration nötig
 * (Ticket: "3 Versuche, Exponential Backoff").
 *
 * SMTP-Fehler werden hier NICHT abgefangen – ein Fehlschlag im Worker
 * lässt BullMQ den Job automatisch erneut versuchen (siehe
 * services/jobs/processors/email.ts).
 */
export async function queueEmail(payload: EmailJobPayload): Promise<string> {
  const priority = payload.priority ?? TEMPLATE_PRIORITY[payload.template];
  const fullPayload: EmailJobPayload = { ...payload, priority };

  console.log(
    `[jobs:email] E-Mail eingereiht: Template "${payload.template}" an ${payload.recipient} ` +
      `(Priorität ${PRIORITY_LABEL[priority]}).`,
  );

  return enqueue(JobType.EMAIL, fullPayload as JobPayload, { priority });
}
