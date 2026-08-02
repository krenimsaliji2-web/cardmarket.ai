import nodemailer, { type Transporter } from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  messageId: string;
}

/** SMTP-Konfiguration fehlt oder ist unvollständig (siehe ENV-Variablen unten). */
export class MissingSmtpConfigError extends Error {
  constructor(missingVar: string) {
    super(`SMTP-Konfiguration unvollständig: ${missingVar} ist nicht gesetzt.`);
    this.name = "MissingSmtpConfigError";
  }
}

/**
 * Baut den Nodemailer-Transporter ausschließlich aus ENV-Variablen
 * (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD) – keine hartcodierten
 * Zugangsdaten. Exportiert (statt intern in sendEmail() versteckt), damit
 * Tests einen eigenen Transporter (z. B. Nodemailers `jsonTransport`)
 * injizieren können, ohne echte SMTP-Verbindungen aufzubauen.
 */
export function createEmailTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host) throw new MissingSmtpConfigError("SMTP_HOST");
  if (!port) throw new MissingSmtpConfigError("SMTP_PORT");
  if (!user) throw new MissingSmtpConfigError("SMTP_USER");
  if (!password) throw new MissingSmtpConfigError("SMTP_PASSWORD");

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass: password },
  });
}

/**
 * Universelle E-Mail-Versandfunktion – die einzige Stelle im Projekt, die
 * tatsächlich E-Mails verschickt. Zukünftige Features sollen ausschließlich
 * diese Funktion (bzw. sendTemplateEmail()) verwenden, nie direkt
 * Nodemailer importieren.
 *
 * `transporter` ist optional injizierbar (Standard: aus ENV gebaut) – für
 * Tests kann hier z. B. `nodemailer.createTransport({ jsonTransport: true })`
 * übergeben werden, um ohne echten SMTP-Server zu verifizieren, was
 * gesendet worden wäre.
 */
export async function sendEmail(
  input: SendEmailInput,
  transporter: Transporter = createEmailTransporter(),
): Promise<SendEmailResult> {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new MissingSmtpConfigError("SMTP_FROM");
  }

  const result = await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments,
  });

  return { messageId: result.messageId };
}
