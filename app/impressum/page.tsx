import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – Project Atlas",
};

/**
 * Platzhalter-Impressum. Siehe Hinweisbox: strukturelle Vorlage, keine
 * rechtsgültige Pflichtangabe. Inhalt/Pflichtangaben unterscheiden sich je
 * nach Land (CH: Art. 3 UWG; DE: § 5 TMG) – vor Livegang von einer
 * fachkundigen Person prüfen lassen.
 */
export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <strong>Hinweis für den Betreiber:</strong> Strukturelle Vorlage, keine
        rechtsgültigen Pflichtangaben. Die genauen Anforderungen unterscheiden
        sich je nach Land (Schweiz: Art. 3 UWG; Deutschland: § 5 TMG). Vor dem
        Livegang von einer fachkundigen Person prüfen und mit echten Angaben
        ersetzen lassen. Diese Box vor Veröffentlichung entfernen.
      </div>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">Impressum</h1>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Angaben gemäß gesetzlicher Anbieterkennzeichnung</h2>
          <p>
            [Firmenname / Rechtsform]
            <br />
            [Straße, PLZ, Ort]
            <br />
            [Land]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Kontakt</h2>
          <p>
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [kontakt@beispiel.ch]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Handelsregister</h2>
          <p>
            [Registergericht]
            <br />
            Registernummer: [UID/Handelsregisternummer]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Verantwortlich für den Inhalt</h2>
          <p>[Name der verantwortlichen Person gemäß Presserecht/UWG]</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Streitschlichtung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen, sofern dies nicht gesetzlich vorgeschrieben ist.
            [Ggf. anpassen, falls relevant.]
          </p>
        </section>
      </div>
    </main>
  );
}
