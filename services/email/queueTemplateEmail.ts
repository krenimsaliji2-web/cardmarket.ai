import type { JobPriority } from "@/services/jobs/job-types";

import { queueEmail, type EmailJobPayload } from "./queueEmail";
import type { EmailAttachment } from "./sendEmail";
import type { TemplateEmailInput } from "./sendTemplateEmail";

export interface QueueTemplateEmailOptions {
  /** Überschreibt die Standard-Priorität je Template (siehe queueEmail.ts TEMPLATE_PRIORITY). */
  priority?: JobPriority;
  attachments?: EmailAttachment[];
}

/**
 * Bequemer Wrapper um queueEmail(): nimmt exakt dieselbe Eingabeform wie
 * das bestehende sendTemplateEmail() entgegen (`{template, to, data}`)
 * und reiht die E-Mail zur asynchronen Zustellung ein, statt sie
 * synchron zu verschicken. Dies soll künftig die von allen Features
 * bevorzugte Aufrufstelle für Template-E-Mails sein – sendTemplateEmail()
 * bleibt intern erhalten und wird ausschließlich vom Worker verwendet.
 */
export async function queueTemplateEmail(
  input: TemplateEmailInput,
  options: QueueTemplateEmailOptions = {},
): Promise<string> {
  const payload = {
    recipient: input.to,
    template: input.template,
    templateData: input.data,
    priority: options.priority,
    attachments: options.attachments,
  } as EmailJobPayload;

  return queueEmail(payload);
}
