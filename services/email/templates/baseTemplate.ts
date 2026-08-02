export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface BaseTemplateInput {
  subject: string;
  /** Innerer Inhalt als HTML (bereits fertige Absätze/Überschriften). */
  bodyHtml: string;
  /** Innerer Inhalt als Klartext (Fallback für Clients ohne HTML). */
  bodyText: string;
}

const LOGO_TEXT = "Project Atlas";
const FOOTER_ADDRESS = "Project Atlas · Musterstraße 1 · 8000 Zürich · Schweiz";
const IMPRESSUM_URL = "https://cardverse.example/impressum";

/**
 * Gemeinsames Layout aller E-Mail-Templates: Logo oben, Inhalt in der
 * Mitte, Footer mit Impressum unten. Tabellenbasiertes Layout mit
 * inline-CSS statt <style>-Block, weil viele E-Mail-Clients (Outlook,
 * ältere Gmail-Versionen) externe/eingebettete <style>-Blöcke ignorieren
 * oder nur eingeschränkt unterstützen – Inline-Styles + Tabellen sind der
 * verlässlichste kleinste gemeinsame Nenner für E-Mail-HTML.
 *
 * `max-width: 600px` + `width: 100%` auf der äußeren Tabelle macht das
 * Layout auf Mobilgeräten (schmales Viewport) responsiv, ohne Media
 * Queries zu benötigen (die in vielen E-Mail-Clients ebenfalls nicht
 * zuverlässig unterstützt werden).
 */
export function renderBaseTemplate(input: BaseTemplateInput): RenderedEmail {
  const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;background-color:#111111;">
                <span style="font-size:20px;font-weight:bold;color:#ffffff;">${escapeHtml(LOGO_TEXT)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.6;">
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background-color:#f4f4f5;color:#71717a;font-size:12px;line-height:1.6;">
                <p style="margin:0 0 8px 0;">${escapeHtml(FOOTER_ADDRESS)}</p>
                <p style="margin:0;">
                  <a href="${IMPRESSUM_URL}" style="color:#71717a;text-decoration:underline;">Impressum</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${LOGO_TEXT}\n\n${input.bodyText}\n\n---\n${FOOTER_ADDRESS}\nImpressum: ${IMPRESSUM_URL}`;

  return { subject: input.subject, html, text };
}

/** Verhindert HTML-Injection über Template-Daten, die in Attribute/Text eingesetzt werden. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
