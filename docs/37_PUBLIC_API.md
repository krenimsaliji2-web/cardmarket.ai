# Project Atlas

# Public API Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die öffentliche API von Project Atlas.

Die API ermöglicht Entwicklern, Händlern und Partnern eine sichere Integration mit der Plattform.

Alle öffentlichen Schnittstellen sind versioniert und dokumentiert.

---

# Goals

Die API soll:

- sicher sein
- schnell sein
- einfach zu verwenden sein
- stabil bleiben
- langfristig kompatibel sein

---

# API Types

Version 1 unterstützt:

- REST API
- Webhooks

Interne Services können zusätzlich tRPC verwenden.

---

# API Versioning

Die API wird versioniert.

Beispiel:

/api/v1/

Neue Hauptversionen:

/api/v2/

Alte Versionen bleiben für einen definierten Zeitraum verfügbar.

---

# Authentication

Unterstützt:

- API Keys
- OAuth 2.0 (zukünftig)

Jeder API-Schlüssel besitzt:

- ID
- Name
- Berechtigungen
- Erstellungsdatum
- Ablaufdatum (optional)

---

# Permissions

API Keys können eingeschränkt werden.

Beispiele:

- Read Marketplace
- Read Cards
- Read Prices
- Create Listings
- Update Listings
- Delete Listings
- Read Orders

---

# Rate Limits

Standard:

100 Requests pro Minute

Erweiterte Limits können für Partner vergeben werden.

---

# Endpoints

Unterstützt:

## Cards

- Karten suchen
- Kartendetails
- Preisinformationen

---

## Marketplace

- Inserate
- Kategorien
- Verkäufer

---

## Orders

- Bestellungen
- Status
- Versand

---

## Users

- Profil
- Verkäuferdaten
- Bewertungen

---

## Collections

- Sammlungen
- Wunschlisten
- Portfolio

---

## Prices

- Marktpreise
- Preisverlauf
- Durchschnittspreise

---

# Pagination

Große Datenmengen werden paginiert.

Unterstützt:

- Cursor Pagination
- Limit
- Offset (optional)

---

# Filtering

Filter:

- Spiel
- Set
- Sprache
- Zustand
- Preis
- Verkäufer
- Grading

---

# Sorting

Sortierung:

- Preis
- Name
- Datum
- Relevanz
- Beliebtheit

---

# Response Format

Alle Antworten besitzen dieselbe Struktur.

Beispiel:

success

data

meta

errors

---

# Error Codes

Standardisierte Fehlercodes.

Beispiele:

400

401

403

404

409

422

429

500

---

# Webhooks

Unterstützte Ereignisse:

- Bestellung erstellt
- Bestellung versendet
- Zahlung erfolgreich
- Auszahlung erfolgt
- Inserat verkauft
- Auktion beendet

---

# Webhook Security

Webhooks werden signiert.

Empfänger müssen Signaturen prüfen.

---

# SDK

Geplant:

- TypeScript SDK
- JavaScript SDK
- PHP SDK

Weitere SDKs können ergänzt werden.

---

# API Documentation

Bereitgestellt werden:

- OpenAPI
- Beispiele
- Code Snippets
- Testumgebung

---

# Sandbox

Entwickler erhalten Zugriff auf eine Testumgebung.

Dort können:

- API Keys
- Webhooks
- Testdaten

genutzt werden.

---

# Monitoring

Überwacht werden:

- Antwortzeiten
- Fehlerquote
- Rate Limits
- Nutzung

---

# Security

Alle Endpunkte verwenden:

- HTTPS
- Authentifizierung
- Berechtigungsprüfung
- Eingabevalidierung
- Rate Limiting

---

# Future Features

Geplant:

- GraphQL API
- Echtzeit-Events
- Streaming API
- Partnerportal

---

# Definition of Done

Die Public API gilt als abgeschlossen wenn:

✓ API versioniert ist

✓ Dokumentation vorhanden ist

✓ Authentifizierung funktioniert

✓ Rate Limits aktiv sind

✓ Webhooks funktionieren

✓ Sandbox verfügbar ist

✓ Performance-Ziele erreicht werden

---

# End of Document