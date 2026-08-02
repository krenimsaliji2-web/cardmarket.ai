# Project Atlas

# Internationalization & Localization Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die Internationalisierung (i18n) und Lokalisierung (l10n) der Plattform.

Project Atlas wird von Anfang an so entwickelt, dass weitere Länder und Sprachen ohne größere Änderungen ergänzt werden können.

---

# Goals

Die Plattform soll:

- mehrere Sprachen unterstützen
- mehrere Währungen unterstützen
- länderspezifische Formate verwenden
- regional angepasst werden können

---

# Initial Countries

Zum Start werden unterstützt:

- Schweiz
- Deutschland

Später:

- Österreich
- Frankreich
- Italien
- Niederlande
- Belgien
- Spanien
- Weitere europäische Länder

---

# Languages

Version 1:

- Deutsch
- Englisch

Version 2:

- Französisch
- Italienisch

Später:

- Spanisch
- Niederländisch
- Weitere Sprachen

---

# Currency

Unterstützte Währungen:

- CHF
- EUR

Zukünftig:

- GBP
- USD

Alle Preise werden intern eindeutig gespeichert.

Wechselkurse können für die Anzeige verwendet werden.

---

# Date Format

Beispiele:

Schweiz

25.07.2026

Deutschland

25.07.2026

Englisch

2026-07-25

Die Anzeige richtet sich nach der Sprache bzw. Region des Benutzers.

---

# Time Zone

Alle Zeitangaben werden intern in UTC gespeichert.

Die Anzeige erfolgt automatisch in der lokalen Zeitzone des Benutzers.

---

# Number Format

Beispiele:

Deutsch

1.234,56

Englisch

1,234.56

---

# Translation System

Alle Texte werden über Übersetzungsdateien verwaltet.

Keine fest codierten Texte im Quellcode.

Unterstützt werden:

- Navigation
- Formulare
- Fehlermeldungen
- Buttons
- E-Mails
- Benachrichtigungen

---

# Dynamic Content

Benutzergenerierte Inhalte wie:

- Inseratsbeschreibungen
- Nachrichten
- Bewertungen

werden nicht automatisch übersetzt.

Eine automatische Übersetzung kann später als optionale Funktion ergänzt werden.

---

# URLs

URLs bleiben möglichst sprachneutral.

Beispiel:

/marketplace

Nicht:

/marktplatz

---

# Search

Die Suche berücksichtigt:

- verschiedene Sprachen
- Synonyme
- regionale Schreibweisen

---

# Country Settings

Je Land können konfiguriert werden:

- Währung
- Sprache
- Versandoptionen
- Steuerregeln
- Zahlungsarten

---

# Notifications

E-Mails und Benachrichtigungen werden in der bevorzugten Sprache des Benutzers versendet.

---

# SEO

Unterstützt werden:

- hreflang
- mehrsprachige Metadaten
- lokalisierte Seitentitel
- lokalisierte Beschreibungen

---

# Accessibility

Die Sprache der Benutzeroberfläche kann jederzeit geändert werden.

Die Auswahl wird dauerhaft gespeichert.

---

# Future Features

Geplant:

- Automatische Spracherkennung
- KI-Übersetzung
- Regionale Startseiten
- Regionale Empfehlungen
- Länderspezifische Aktionen

---

# Performance Goals

Sprachwechsel

< 500 ms

Übersetzungen

Werden beim Build oder über optimierte Ladeverfahren bereitgestellt.

---

# Definition of Done

Die Internationalisierung gilt als abgeschlossen wenn:

✓ Mehrere Sprachen unterstützt werden

✓ Mehrere Währungen funktionieren

✓ Datums- und Zahlenformate korrekt angezeigt werden

✓ Zeitzonen berücksichtigt werden

✓ Übersetzungen vollständig sind

✓ SEO unterstützt wird

---

# End of Document