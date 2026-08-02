import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
}

/** PLATZHALTER-Template – noch von keinem Feature automatisch verwendet. */
export function renderPasswordResetEmail(data: PasswordResetData): RenderedEmail {
  const subject = "Passwort zurücksetzen";

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Passwort zurücksetzen</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.userName)},</p>
    <p style="margin:0 0 16px 0;">
      klicke auf den folgenden Link, um ein neues Passwort zu vergeben.
    </p>
    <p style="margin:0 0 16px 0;">
      <a href="${escapeHtml(data.resetUrl)}" style="display:inline-block;padding:10px 20px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:4px;">
        Passwort zurücksetzen
      </a>
    </p>
    <p style="margin:0;color:#71717a;">[PLATZHALTER: Ablaufzeit/Sicherheitshinweis folgt]</p>
  `;

  const bodyText = `Passwort zurücksetzen\n\nHallo ${data.userName},\n\nklicke auf den folgenden Link, um ein neues Passwort zu vergeben:\n${data.resetUrl}\n\n[PLATZHALTER: Ablaufzeit/Sicherheitshinweis folgt]`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
