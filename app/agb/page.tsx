import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen – Project Atlas",
};

/**
 * Platzhalter-AGB. Siehe Hinweisbox: strukturelle Vorlage, kein
 * rechtsgültiger Vertragstext. Insbesondere Widerrufsrecht/Gewährleistung
 * bei Verkäufen zwischen Privatpersonen (Peer-to-Peer-Marktplatz) sind
 * rechtlich komplex und müssen von einer fachkundigen Person geprüft
 * werden.
 */
export default function AgbPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <strong>Hinweis für den Betreiber:</strong> Strukturelle Vorlage, kein
        rechtsgültiger Vertragstext. Insbesondere Widerrufsrecht,
        Gewährleistung und Haftung bei einem Peer-to-Peer-Marktplatz
        (Verträge zwischen Käufer:in und Verkäufer:in, nicht mit Project
        Atlas selbst) sind rechtlich komplex – unbedingt von einer
        fachkundigen Person prüfen lassen. Diese Box vor Veröffentlichung
        entfernen.
      </div>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Allgemeine Geschäftsbedingungen
      </h1>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Geltungsbereich</h2>
          <p>
            Diese Bedingungen gelten für die Nutzung des Marktplatzes Project
            Atlas (&quot;Plattform&quot;), betrieben von [Firmenname]. Mit der
            Registrierung eines Kontos akzeptierst du diese Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Rolle der Plattform</h2>
          <p>
            Project Atlas stellt eine technische Plattform bereit, über die
            registrierte Nutzer:innen (&quot;Verkäufer:innen&quot;) Trading Cards an
            andere Nutzer:innen (&quot;Käufer:innen&quot;) verkaufen können. Der
            Kaufvertrag kommt direkt zwischen Verkäufer:in und Käufer:in
            zustande – Project Atlas ist nicht Vertragspartei des jeweiligen
            Kaufvertrags.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Konto und Registrierung</h2>
          <p>
            Für die Nutzung bestimmter Funktionen (Kaufen, Verkaufen, Chat)
            ist ein Konto erforderlich. Du bist verpflichtet, wahrheitsgemäße
            Angaben zu machen und dein Passwort geheim zu halten.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Angebote und Verkauf</h2>
          <p>
            Verkäufer:innen sind für die Richtigkeit ihrer Angebote (Zustand,
            Beschreibung, Preis, Verfügbarkeit) selbst verantwortlich. Project
            Atlas prüft Angebote nicht inhaltlich vor Veröffentlichung, behält
            sich aber vor, Angebote bei Verstößen gegen diese Bedingungen zu
            entfernen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Zahlung</h2>
          <p>
            Zahlungen werden über unseren Zahlungsdienstleister Stripe
            abgewickelt. Es gelten zusätzlich dessen Nutzungsbedingungen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Widerrufsrecht und Gewährleistung</h2>
          <p>
            [Rechtlich zu prüfen und zu ergänzen: Umfang und Ausschlüsse des
            Widerrufsrechts sowie Gewährleistungsansprüche bei
            Verträgen zwischen Privatpersonen unterscheiden sich von
            gewerblichen Verkäufen und müssen entsprechend differenziert
            dargestellt werden.]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">7. Haftung</h2>
          <p>
            Project Atlas haftet nicht für die Richtigkeit von Angeboten
            Dritter oder für die ordnungsgemäße Erfüllung von Kaufverträgen
            zwischen Nutzer:innen. [Haftungsausschluss rechtlich prüfen und
            ergänzen.]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">8. Änderungen dieser Bedingungen</h2>
          <p>
            Wir behalten uns vor, diese Bedingungen mit Wirkung für die
            Zukunft zu ändern. Über wesentliche Änderungen informieren wir
            registrierte Nutzer:innen in geeigneter Form.
          </p>
        </section>

        <p className="text-xs">Stand: [Datum einfügen]</p>
      </div>
    </main>
  );
}
