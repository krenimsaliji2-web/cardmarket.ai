import { escapeHtml, renderBaseTemplate, type RenderedEmail } from "./baseTemplate";

export interface NewMessageData {
  recipientName: string;
  senderName: string;
  /** Gekürzter Nachrichtentext für die Vorschau (Absender-Roh­text, wird hier escaped). */
  messagePreview: string;
  conversationUrl: string;
}

/** Feature 74 – Käufer-/Verkäufer-Chat: Benachrichtigung bei neu eingegangener Nachricht. */
export function renderNewMessageEmail(data: NewMessageData): RenderedEmail {
  const subject = `Neue Nachricht von ${data.senderName}`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px 0;font-size:20px;">Neue Nachricht</h1>
    <p style="margin:0 0 16px 0;">Hallo ${escapeHtml(data.recipientName)},</p>
    <p style="margin:0 0 16px 0;">
      <strong>${escapeHtml(data.senderName)}</strong> hat dir eine neue Nachricht geschickt:
    </p>
    <p style="margin:0 0 16px 0;padding:12px 16px;background-color:#f4f4f5;border-radius:6px;color:#3f3f46;">
      ${escapeHtml(data.messagePreview)}
    </p>
    <p style="margin:0 0 16px 0;">
      <a href="${escapeHtml(data.conversationUrl)}" style="display:inline-block;padding:10px 20px;background-color:#111111;color:#ffffff;text-decoration:none;border-radius:4px;">
        Chat öffnen
      </a>
    </p>
  `;

  const bodyText = `Neue Nachricht\n\nHallo ${data.recipientName},\n\n${data.senderName} hat dir eine neue Nachricht geschickt:\n\n"${data.messagePreview}"\n\nChat öffnen: ${data.conversationUrl}`;

  return renderBaseTemplate({ subject, bodyHtml, bodyText });
}
