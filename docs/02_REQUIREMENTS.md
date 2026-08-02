# CardMarket.AI

# Functional Requirements

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument beschreibt sämtliche funktionalen Anforderungen der Plattform.

Jede Funktion muss vor der Implementierung dokumentiert, geplant und getestet werden.

Claude Code darf keine Funktionen implementieren, die nicht in diesem Dokument definiert oder ausdrücklich freigegeben wurden.

---

# Core Product

CardMarket.AI ist eine Plattform für den Kauf, Verkauf und die Verwaltung von Trading Cards.

Sie kombiniert Marketplace, Portfolio, Collection Manager und KI-Assistent in einer einzigen Anwendung.

---

# Supported Card Categories

Die Plattform muss modular aufgebaut sein und neue Kategorien unterstützen.

Initial:

- Pokémon
- Yu-Gi-Oh!
- Magic: The Gathering
- One Piece
- Disney Lorcana
- Dragon Ball
- Panini
- Topps
- Match Attax
- Sportkarten

Später:

- Digimon
- Flesh and Blood
- Weiss Schwarz
- Star Wars Unlimited
- weitere Trading-Card-Spiele

---

# User Types

## Guest

Kann:

- Startseite ansehen
- Karten suchen
- Inserate ansehen
- Verkäuferprofile ansehen
- Preise ansehen

Kann nicht:

- Kaufen
- Verkaufen
- Nachrichten senden
- Gebote abgeben

---

## Registered User

Kann:

- Kaufen
- Verkaufen
- Bieten
- Preisvorschläge senden
- Nachrichten senden
- Sammlung verwalten
- Portfolio verwalten
- Wunschlisten erstellen
- Bewertungen schreiben
- Benachrichtigungen erhalten

---

## Verified Seller

Zusätzlich:

- größere Verkaufslimits
- Verifizierungsabzeichen
- Händlerfunktionen
- Statistiken

---

## Moderator

Kann:

- Inserate sperren
- Benutzer verwarnen
- Meldungen bearbeiten
- Chats prüfen (gemäß Richtlinien)
- Betrugsfälle bearbeiten

---

## Administrator

Vollzugriff.

---

# Marketplace Features

## Kaufen

Benutzer können:

- sofort kaufen
- Preisvorschlag senden
- Verkäufer kontaktieren

---

## Verkaufen

Verkäufer können:

- Inserate erstellen
- Bilder hochladen
- Preise festlegen
- Auktionen starten
- Lagerbestand verwalten
- Inserate pausieren
- Inserate bearbeiten

---

# Auction System

Unterstützt:

- Startpreis
- Mindestpreis
- Sofort-Kaufen
- Mindestgebot
- automatische Gebote
- Countdown
- Anti-Sniping
- Gebotsverlauf

---

# Search

Die Suche muss unterstützen:

- Volltextsuche
- Autocomplete
- Kartenname
- Set
- Edition
- Sprache
- Zustand
- Preis
- Verkäufer
- Kategorie
- Seltenheit
- PSA
- BGS
- CGC

---

# Collection Manager

Benutzer können:

- Karten hinzufügen
- Karten entfernen
- Karten importieren
- Dubletten markieren
- Wunschkarten markieren
- fehlende Karten anzeigen
- Gesamtwert berechnen

---

# Portfolio

Anzeige:

- Gesamtwert
- Gewinn
- Verlust
- Preisentwicklung
- Diagramme
- historische Werte

---

# Wishlist

Benutzer können:

- Karten speichern
- Preisalarm setzen
- Benachrichtigungen erhalten

---

# Favorites

Benutzer können:

- Verkäufer folgen
- Karten speichern
- Suchen speichern

---

# Messaging

Privater Chat.

Unterstützt:

- Bilder
- Dateien
- Gelesen-Status
- Blockieren
- Melden

---

# Notifications

Browser

E-Mail

Push

In-App

---

# Reviews

Käufer bewerten Verkäufer.

Verkäufer bewerten Käufer.

Bewertungen bestehen aus:

- Sterne
- Kommentar
- Datum
- Transaktion

---

# AI Features

KI unterstützt:

- Kartenerkennung
- OCR
- automatische Beschreibung
- Preisvorschlag
- Zustandsanalyse
- Bilder verbessern
- Kategorien erkennen

---

# Dashboard

Jeder Benutzer besitzt ein Dashboard.

Anzeige:

- Verkäufe
- Käufe
- Portfolio
- Sammlung
- Statistiken
- Benachrichtigungen

---

# Mobile

Alle Funktionen müssen vollständig mobil nutzbar sein.

Keine Desktop-Funktion darf auf Smartphones fehlen.

---

# Accessibility

Die Plattform soll WCAG-konform entwickelt werden.

---

# Internationalization

Sprachen:

Deutsch

Englisch

Französisch

Italienisch

Weitere Sprachen später.

---

# Currencies

CHF

EUR

Weitere später.

---

# End of Document