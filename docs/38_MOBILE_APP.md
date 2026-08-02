# Project Atlas

# Mobile App Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die mobilen Anwendungen von Project Atlas.

Neben der Webplattform werden native Apps für iOS und Android entwickelt.

Die Mobile Apps sollen den vollständigen Funktionsumfang der Plattform bieten und gleichzeitig die Besonderheiten mobiler Geräte optimal nutzen.

---

# Goals

Die Mobile App soll:

- Schnell sein
- Einfach bedienbar sein
- Offline teilweise funktionieren
- Push-Benachrichtigungen unterstützen
- Kamera und biometrische Anmeldung nutzen

---

# Supported Platforms

Version 1:

- iOS
- Android

Tablets werden ebenfalls unterstützt.

---

# Authentication

Unterstützt:

- E-Mail & Passwort
- Passkeys
- Face ID
- Touch ID
- Fingerabdruck
- MFA

---

# Home Screen

Anzeige:

- Marketplace
- Neue Karten
- Laufende Auktionen
- Beobachtete Karten
- Empfehlungen
- Neuigkeiten

---

# Marketplace

Benutzer können:

- Karten suchen
- Filter anwenden
- Inserate ansehen
- Kaufen
- Verkaufen
- Angebote senden
- Auktionen verfolgen

---

# Card Scanner

Die Kamera unterstützt:

- Kartenerkennung
- OCR
- Zustandserkennung
- Varianten-Erkennung
- Preisvorschläge

Mehrere Karten können nacheinander gescannt werden.

---

# Collection Manager

Benutzer können:

- Karten hinzufügen
- Karten entfernen
- Sammlungen verwalten
- Sammlungswert anzeigen
- Preisentwicklung verfolgen

---

# Portfolio

Anzeige:

- Gesamtwert
- Wertentwicklung
- Gewinne
- Verluste
- Beliebteste Karten

---

# Wishlist

Benutzer können:

- Wunschkarten speichern
- Preisalarme erhalten
- Verfügbarkeitsbenachrichtigungen erhalten

---

# Seller Tools

Verkäufer können:

- Inserate erstellen
- Fotos aufnehmen
- Preise ändern
- Bestand verwalten
- Bestellungen bearbeiten
- Versand bestätigen

---

# Notifications

Unterstützt:

- Push
- In-App
- E-Mail

---

# Messages

Kompletter Chat mit:

- Käufern
- Verkäufern
- Support

---

# Orders

Anzeige:

- Bestellungen
- Versandstatus
- Tracking
- Rechnungen

---

# Camera

Unterstützt:

- Karten scannen
- Bilder aufnehmen
- QR-Codes
- Barcodes

---

# Offline Mode

Offline verfügbar:

- Eigene Sammlung
- Wunschliste
- Zuletzt geöffnete Karten

Synchronisierung erfolgt automatisch nach Wiederherstellung der Internetverbindung.

---

# Sync

Synchronisiert werden:

- Sammlung
- Portfolio
- Nachrichten
- Benachrichtigungen
- Einstellungen

---

# Performance

App-Start

< 2 Sekunden

Kartenscan

< 5 Sekunden

Suche

< 300 ms

---

# Accessibility

Unterstützt:

- Screenreader
- Dynamische Schriftgrößen
- Hohe Kontraste
- Sprachsteuerung
- Tastaturunterstützung (Tablets)

---

# Deep Links

Die App unterstützt Deep Links.

Beispiele:

- Karte
- Inserat
- Auktion
- Benutzerprofil
- Bestellung

---

# Security

Die App verwendet:

- HTTPS
- Sichere Tokens
- Biometrische Anmeldung
- Verschlüsselte lokale Speicherung sensibler Daten
- Automatische Sitzungsverwaltung

---

# Analytics

Erfasst werden:

- App-Starts
- Abstürze
- Performance
- Nutzung von Funktionen

Die Datenerfassung erfolgt gemäß den Datenschutz- und Einwilligungseinstellungen des Benutzers.

---

# Future Features

Geplant:

- Live Scanner
- AR-Kartenvorschau
- Sprachsuche
- Offline Scanner
- Widget für Preisalarme
- Apple Watch Unterstützung
- Wear OS Unterstützung

---

# Definition of Done

Die Mobile App gilt als abgeschlossen wenn:

✓ Login funktioniert

✓ Marketplace vollständig nutzbar ist

✓ Kartenscanner funktioniert

✓ Sammlung synchronisiert wird

✓ Push-Benachrichtigungen funktionieren

✓ Offline-Modus verfügbar ist

✓ Performance-Ziele erreicht werden

✓ Tests erfolgreich sind

---

# End of Document