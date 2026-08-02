# Project Atlas

# Search System Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument beschreibt das komplette Suchsystem der Plattform.

Die Suche gehört zu den wichtigsten Funktionen und muss schnell, intelligent und benutzerfreundlich sein.

Das Ziel ist, dass Benutzer jede Karte innerhalb weniger Sekunden finden.

---

# Search Engine

Die Plattform verwendet:

- Meilisearch

Gründe:

- Sehr schnell
- Tippfehler-Toleranz
- Einfache Filter
- Hohe Performance
- Skalierbar

---

# Search Sources

Durchsuchbar sind:

- Karten
- Inserate
- Auktionen
- Benutzer
- Sammlungen
- Händler
- Sets
- Serien

---

# Global Search

Die globale Suche befindet sich dauerhaft in der Navigation.

Während der Eingabe erscheinen Live-Vorschläge.

Beispiele:

- Charizard
- Pikachu
- Blue-Eyes White Dragon
- Black Lotus

---

# Autocomplete

Während der Eingabe werden angezeigt:

- Karten
- Sets
- Kategorien
- Benutzer
- Häufige Suchbegriffe

---

# Fuzzy Search

Tippfehler werden automatisch erkannt.

Beispiele:

Charzard

→ Charizard

Pokmon

→ Pokémon

Blu Eyes

→ Blue-Eyes

---

# Natural Language Search

Die Suche versteht natürliche Sprache.

Beispiele:

Pokemon Karten unter 100 CHF

PSA 10 Charizard

Yu-Gi-Oh Ghost Rare

Magic Karte aus Alpha

Englische Pikachu Karte

---

# Search Filters

Benutzer können filtern nach:

Spiel

Kategorie

Set

Kartennummer

Seltenheit

Sprache

Zustand

Grading

Grading-Unternehmen

Preis

Verkäufer

Standort

Versandland

Verfügbarkeit

Auktion

Sofort-Kauf

Neu eingestellt

---

# Sorting

Sortieren nach:

Relevanz

Preis aufsteigend

Preis absteigend

Neueste

Beliebteste

Meist angesehen

Endet bald

Beste Bewertung

---

# Saved Searches

Benutzer können Suchanfragen speichern.

Beispiele:

PSA 10 Charizard

Pokémon unter 50 CHF

One Piece Manga Rare

---

# Search Alerts

Benutzer erhalten Benachrichtigungen wenn:

- neue Inserate erscheinen
- Preis unter Grenzwert fällt
- Auktionen starten
- Wunschkarte verfügbar wird

---

# AI Search

Die KI erkennt Suchabsichten.

Beispiel:

"Ich suche einen günstigen Glurak"

→ Preisfilter aktivieren

→ Pokémon auswählen

→ Charizard anzeigen

---

# Voice Search

Für mobile Geräte geplant.

Benutzer können Suchbegriffe sprechen.

---

# Image Search

Benutzer können ein Kartenbild hochladen.

Die KI sucht ähnliche Karten.

---

# Barcode Search

Für zukünftige Produkte geplant.

---

# Search History

Gespeichert werden:

- letzte Suchanfragen
- zuletzt besuchte Karten

Benutzer kann Verlauf löschen.

---

# Trending Searches

Anzeige:

Beliebteste Suchbegriffe

Beliebteste Karten

Beliebteste Sets

Beliebteste Auktionen

---

# Performance Goals

Autocomplete

<100 ms

Suche

<300 ms

Filter

<200 ms

---

# Accessibility

Suche unterstützt:

- Tastatur
- Screenreader
- Hoher Kontrast
- Mobile Bedienung

---

# Analytics

Erfasst werden:

- Häufigste Suchbegriffe
- Suchbegriffe ohne Treffer
- Klickrate
- Conversion Rate
- Beliebte Filter

Diese Daten helfen bei der Verbesserung der Suche.

---

# Definition of Done

Das Suchsystem gilt als abgeschlossen, wenn:

✓ Live-Suche funktioniert

✓ Filter funktionieren

✓ Sortierung funktioniert

✓ KI-Suche funktioniert

✓ Gespeicherte Suchen verfügbar sind

✓ Suchbenachrichtigungen funktionieren

✓ Performance-Ziele erreicht werden

✓ Tests erfolgreich sind

---

# End of Document