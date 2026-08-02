import type { Job } from "bullmq";
import type { Transporter } from "nodemailer";

import type { EmailJobPayload } from "@/services/email/queueEmail";
import { sendTemplateEmail } from "@/services/email/sendTemplateEmail";
import type { TemplateEmailInput } from "@/services/email/sendTemplateEmail";

/**
 * Verarbeitet EMAIL-Jobs (Feature 56 – E-Mail Queue Integration): ruft
 * intern sendTemplateEmail() auf – der einzige Ort im gesamten Projekt,
 * der diese Funktion noch aufruft. Alle Features sollen stattdessen
 * services/email/queueTemplateEmail.ts (bzw. queueEmail.ts) verwenden,
 * das die E-Mail über diese Queue statt synchron verschickt.
 *
 * `transporter` ist – wie bei sendEmail()/sendTemplateEmail() selbst –
 * ein optionaler zweiter Parameter, den BullMQ beim echten Aufruf nie
 * mitgibt (Worker ruft Processoren immer nur mit `(job)` auf, siehe
 * services/jobs/worker.ts), der aber Tests erlaubt, einen Mock-
 * Transporter (Nodemailers `jsonTransport`) zu injizieren, ohne echte
 * SMTP-Verbindungen aufzubauen.
 *
 * SMTP-Fehler werden bewusst NICHT abgefangen – ein geworfener Fehler
 * lässt BullMQ den Job als fehlgeschlagen markieren und automatisch mit
 * exponentiellem Backoff erneut versuchen (siehe services/email/
 * queueEmail.ts, 3 Versuche). Kein try/catch, das den Fehler
 * verschlucken würde – "SMTP Fehler nicht abstürzen lassen, BullMQ
 * übernimmt Retry" (Ticket).
 */
export async function processEmailJob(job: Job, transporter?: Transporter): Promise<void> {
  const payload = job.data as EmailJobPayload;

  console.log(
    `[jobs:email] Verarbeite E-Mail-Job: Template "${payload.template}" an ${payload.recipient} (Job ${job.id}).`,
  );

  // Sicher, da payload ausschließlich über queueEmail()/queueTemplateEmail()
  // entsteht, die recipient/template/templateData exakt aus einem gültigen
  // TemplateEmailInput ableiten (siehe services/email/queueEmail.ts).
  const templateInput = {
    template: payload.template,
    to: payload.recipient,
    data: payload.templateData,
  } as TemplateEmailInput;

  await sendTemplateEmail(templateInput, transporter, payload.attachments);

  console.log(`[jobs:email] E-Mail gesendet an ${payload.recipient} (Job ${job.id}).`);
}
