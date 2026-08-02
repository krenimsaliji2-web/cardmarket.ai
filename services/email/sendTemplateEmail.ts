import type { Transporter } from "nodemailer";

import { sendEmail, type EmailAttachment, type SendEmailResult } from "./sendEmail";
import type { RenderedEmail } from "./templates/baseTemplate";
import { renderInvoiceCreatedEmail, type InvoiceCreatedData } from "./templates/invoiceCreated";
import { renderNewMessageEmail, type NewMessageData } from "./templates/newMessage";
import { renderOrderConfirmationEmail, type OrderConfirmationData } from "./templates/orderConfirmation";
import { renderPasswordResetEmail, type PasswordResetData } from "./templates/passwordReset";
import { renderPriceAlertEmail, type PriceAlertData } from "./templates/priceAlert";
import { renderReviewRequestEmail, type ReviewRequestData } from "./templates/reviewRequest";
import { renderVerifyEmailEmail, type VerifyEmailData } from "./templates/verifyEmail";

export type TemplateEmailInput =
  | { template: "orderConfirmation"; to: string; data: OrderConfirmationData }
  | { template: "invoiceCreated"; to: string; data: InvoiceCreatedData }
  | { template: "reviewRequest"; to: string; data: ReviewRequestData }
  | { template: "priceAlert"; to: string; data: PriceAlertData }
  | { template: "passwordReset"; to: string; data: PasswordResetData }
  | { template: "verifyEmail"; to: string; data: VerifyEmailData }
  | { template: "newMessage"; to: string; data: NewMessageData };

/** Rendert die passende Vorlage anhand des `template`-Diskriminators (keine Preisgabe an sendEmail() vor der Auswahl). */
function renderTemplate(input: TemplateEmailInput): RenderedEmail {
  switch (input.template) {
    case "orderConfirmation":
      return renderOrderConfirmationEmail(input.data);
    case "invoiceCreated":
      return renderInvoiceCreatedEmail(input.data);
    case "reviewRequest":
      return renderReviewRequestEmail(input.data);
    case "priceAlert":
      return renderPriceAlertEmail(input.data);
    case "passwordReset":
      return renderPasswordResetEmail(input.data);
    case "verifyEmail":
      return renderVerifyEmailEmail(input.data);
    case "newMessage":
      return renderNewMessageEmail(input.data);
  }
}

/**
 * Rendert eine der vorbereiteten Vorlagen (services/email/templates/) mit
 * den übergebenen Template-Daten und verschickt sie über sendEmail() – die
 * einzige weitere Stelle, die tatsächlich Mails versendet. `transporter`
 * wird 1:1 an sendEmail() weitergereicht (siehe dort für die Test-Mock-
 * Injektion via Nodemailers `jsonTransport`).
 *
 * Seit Feature 56 (E-Mail Queue Integration) ist services/jobs/processors/
 * email.ts der EINZIGE Aufrufer dieser Funktion – alle Features sollen
 * stattdessen services/email/queueTemplateEmail.ts verwenden, das die
 * E-Mail über die Queue statt synchron verschickt.
 *
 * `attachments` ist ein rein additiver, optionaler dritter Parameter
 * (Feature 56) – reicht Anhänge an sendEmail() durch, das sie bereits
 * unterstützt. Templates/SMTP-Logik/Nodemailer-Transport bleiben dabei
 * unverändert.
 */
export async function sendTemplateEmail(
  input: TemplateEmailInput,
  transporter?: Transporter,
  attachments?: EmailAttachment[],
): Promise<SendEmailResult> {
  const rendered = renderTemplate(input);

  return sendEmail(
    {
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments,
    },
    transporter,
  );
}
