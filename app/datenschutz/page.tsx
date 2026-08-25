import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Project Atlas",
};

/**
 * Platzhalter-Datenschutzerklärung. WICHTIG (siehe Hinweisbox unten, auch
 * für Betreiber sichtbar): Text ist eine strukturelle Vorlage, KEINE
 * rechtsgültige Datenschutzerklärung. Vor Live-Schaltung von einer
 * fachkundigen Person (Anwalt/Datenschutzbeauftragter) prüfen und mit den
 * echten Firmendaten sowie den tatsächlich eingesetzten Diensten
 * (Stripe, E-Mail-Versand, Hosting-Anbieter) befüllen lassen.
 */
export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <strong>Hinweis für den Betreiber:</strong> Dies ist eine strukturelle
        Vorlage, keine rechtsgültige Datenschutzerklärung. Vor dem Livegang von
        einer fachkundigen Person (Anwalt/Datenschutzbeauftragter) prüfen und
        mit echten Angaben (Firma, Kontakt, tatsächlich genutzte
        Drittanbieter) ersetzen lassen. Diese Box vor Veröffentlichung entfernen.
      </div>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">Datenschutzerklärung</h1>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Verantwortliche Stelle</h2>
          <p>
            [Firmenname]
            <br />
            [Straße, PLZ, Ort]
            <br />
            [Land]
            <br />
            E-Mail: [datenschutz@beispiel.ch]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Welche Daten wir verarbeiten</h2>
          <p>
            Bei der Registrierung und Nutzung von Project Atlas verarbeiten wir
            insbesondere: Kontodaten (Benutzername, E-Mail-Adresse, verschlüsseltes
            Passwort), Profil- und Verkäuferdaten (sofern angelegt), Bestell- und
            Zahlungsdaten (Bestellhistorie; die eigentliche Zahlungsabwicklung
            übernimmt unser Zahlungsdienstleister Stripe, siehe Punkt 4),
            Nachrichten zwischen Käufer:innen und Verkäufer:innen sowie technische
            Daten (z. B. IP-Adresse, Zeitstempel) im Rahmen des normalen
            Serverbetriebs.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Zweck und Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags (Bereitstellung
            des Marktplatzes, Kauf-/Verkaufsabwicklung), zur Erfüllung gesetzlicher
            Pflichten (z. B. Aufbewahrungspflichten) sowie – soweit erforderlich – auf
            Grundlage deiner Einwilligung.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Eingesetzte Dienste Dritter</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Stripe</strong> (Zahlungsabwicklung) –
              Zahlungsdaten werden direkt von Stripe verarbeitet, nicht von uns
              gespeichert.
            </li>
            <li>
              <strong className="text-foreground">Hosting/Infrastruktur</strong> – [Hosting-Anbieter
              eintragen, z. B. Vercel/Hetzner], inkl. Standort der Serverinfrastruktur.
            </li>
            <li>
              <strong className="text-foreground">E-Mail-Versand</strong> – für
              Transaktions-E-Mails (Bestellbestätigung, Passwort-Reset).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Cookies</h2>
          <p>
            Wir setzen ausschließlich technisch notwendige Cookies ein (insbesondere ein
            Session-Cookie zur Anmeldung). Es findet aktuell kein Tracking und keine
            Analyse deines Nutzungsverhaltens durch Dritte statt.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Speicherdauer</h2>
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie es für die genannten
            Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">7. Deine Rechte</h2>
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
            Verarbeitung deiner Daten sowie auf Datenübertragbarkeit. Wende dich dazu an
            die oben genannte Kontaktadresse.
          </p>
        </section>

        <p className="text-xs">Stand: [Datum einfügen]</p>
      </div>
    </main>
  );
}
