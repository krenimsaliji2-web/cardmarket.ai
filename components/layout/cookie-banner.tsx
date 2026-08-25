"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "atlas_cookie_consent";

/**
 * Cookie-Hinweis-Banner. Client Component, da der Zustimmungsstatus rein
 * clientseitig in localStorage liegt (kein neuer Server-/DB-Zustand nötig –
 * die einzigen tatsächlich gesetzten Cookies sind die technisch
 * notwendigen Better-Auth-Session-Cookies, siehe lib/auth/auth.ts; es gibt
 * aktuell keine Analytics-/Tracking-Cookies, entsprechend ehrlich ist der
 * Text formuliert).
 *
 * "Nur notwendige" und "Alle akzeptieren" führen aktuell zum selben
 * Ergebnis (nur die ohnehin technisch notwendigen Cookies werden gesetzt) –
 * beide Optionen bewusst trotzdem vorhanden, falls das Projekt später
 * optionale Cookies (Analytics o. Ä.) ergänzt; dann kann an dieser einen
 * Stelle echte Unterscheidung eingebaut werden, ohne den Banner neu zu
 * bauen.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage kann in seltenen Fällen (z. B. Privatmodus mit
      // strikten Einstellungen) nicht verfügbar sein – dann einfach keinen
      // Banner zeigen, statt die Seite mit einem Fehler zu blockieren.
    }
  }, []);

  function acceptAll() {
    try {
      localStorage.setItem(STORAGE_KEY, "all");
    } catch {
      // s. o.
    }
    setVisible(false);
  }

  function acceptEssentialOnly() {
    try {
      localStorage.setItem(STORAGE_KEY, "essential");
    } catch {
      // s. o.
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Wir verwenden ausschließlich technisch notwendige Cookies (z. B. für deine
          Anmeldung). Mehr dazu in unserer{" "}
          <a href="/datenschutz" className="underline hover:text-foreground">
            Datenschutzerklärung
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={acceptEssentialOnly}>
            Nur notwendige
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Alle akzeptieren
          </Button>
        </div>
      </div>
    </div>
  );
}
