import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface VerifyEmailData {
  userName: string;
  verifyUrl: string;
}

/** PLATZHALTER-Template – noch von keinem Feature automatisch verwendet. */
export function renderVerifyEmailEmail(data: VerifyEmailData): RenderedEmail {
  const subject = "Bitte bestätige deine E-Mail-Adresse";

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">E-Mail-Adresse bestätigen</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.userName)},</p>
    <p style="margin:0 0 16px 0;">
      klicke auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen.
    </p>
    <p style="margin:0 0 16px 0;">
      <a href="${escapeHtml(data.verifyUrl)}" style="display:inline-block;padding:10px 20px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:4px;">
        E-Mail bestätigen
      </a>
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: Ablaufzeit folgt]</p>
  `;

  const bodyText = `E-Mail-Adresse bestätigen\n\nHallo ${data.userName},\n\nklicke auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:\n${data.verifyUrl}\n\n[PLATZHALTER: Ablaufzeit folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
