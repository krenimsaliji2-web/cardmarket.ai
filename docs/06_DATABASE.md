# Project Atlas

# Database Design

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert alle Datenbankmodule der Plattform.

Es beschreibt die Kernentitäten und ihre Beziehungen.

Die detaillierten Tabellen werden im Dokument
07_DATABASE_SCHEMA.md definiert.

---

# Database Philosophy

Die Datenbank wird normalisiert aufgebaut.

Grundsätze:

- Keine doppelten Daten
- Eindeutige Primärschlüssel (UUID)
- Fremdschlüssel für Beziehungen
- Soft Deletes, wo sinnvoll
- Zeitstempel für alle Datensätze
- Erweiterbar ohne Breaking Changes

---

# Core Modules

## 1. Users

Verwaltet:

- Benutzerkonten
- Profile
- Rollen
- Einstellungen
- Verifizierung
- Login-Informationen

---

## 2. Organizations

Für Händler und Unternehmen.

Unterstützt:

- Firmenprofil
- Mitarbeiter
- Rollen
- Berechtigungen

---

## 3. Cards

Die zentrale Kartendatenbank.

Enthält:

- Name
- Spiel
- Set
- Nummer
- Seltenheit
- Sprache
- Künstler
- Erscheinungsdatum
- Bilder

---

## 4. Card Sets

Kartensets.

Beispiele:

- Base Set
- Scarlet & Violet
- 151
- Lost Origin

---

## 5. Inventory

Verkäuferbestand.

Speichert:

- Zustand
- Sprache
- Menge
- Lagerort
- Einkaufspreis

---

## 6. Listings

Inserate.

Enthält:

- Preis
- Verkäufer
- Bilder
- Beschreibung
- Status

---

## 7. Auctions

Auktionen.

Speichert:

- Startpreis
- Enddatum
- Gebote
- Gewinner

---

## 8. Bids

Alle Gebote.

Mit:

- Benutzer
- Betrag
- Zeitpunkt

---

## 9. Orders

Bestellungen.

Enthält:

- Käufer
- Verkäufer
- Produkte
- Status
- Versand

---

## 10. Payments

Zahlungen.

Speichert:

- Zahlungsstatus
- Zahlungsanbieter
- Gebühren
- Provision

---

## 11. Payouts

Auszahlungen an Verkäufer.

---

## 12. Shipping

Versandinformationen.

- Trackingnummer
- Versanddienstleister
- Status

---

## 13. Messages

Privater Chat.

---

## 14. Reviews

Bewertungen.

Käufer ↔ Verkäufer.

---

## 15. Collection

Sammlung eines Benutzers.

---

## 16. Portfolio

Historische Wertentwicklung.

---

## 17. Wishlist

Gespeicherte Suchwünsche.

---

## 18. Notifications

Benachrichtigungen.

---

## 19. Search Index

Optimierte Suchdaten.

---

## 20. Images

Alle hochgeladenen Bilder.

---

## 21. AI

KI-Ergebnisse.

Zum Beispiel:

- OCR
- Zustandsanalyse
- Kartenerkennung
- Preisvorschläge

---

## 22. Reports

Gemeldete Inhalte.

---

## 23. Moderation

Moderationsentscheidungen.

---

## 24. Admin

Administrative Aktionen.

Audit-Logs.

---

## 25. Analytics

Statistiken.

Dashboard-Daten.

---

## 26. Audit Logs

Jede wichtige Aktion wird protokolliert.

Beispiele:

- Login
- Passwortänderung
- Gebot abgegeben
- Auktion erstellt
- Inserat gelöscht
- Auszahlung ausgelöst

---

# Shared Tables

Folgende Tabellen können von mehreren Modulen verwendet werden:

- Countries
- Languages
- Currencies
- Permissions
- Roles
- Tags
- Files
- Settings

---

# Naming Convention

Tabellen:

snake_case

Beispiele:

users

card_sets

auction_bids

portfolio_entries

Spalten:

snake_case

UUID als Primärschlüssel.

---

# Relationships

Alle Beziehungen werden über Foreign Keys definiert.

Keine redundanten IDs.

---

# Index Strategy

Indizes werden verwendet für:

- Suche
- Fremdschlüssel
- Preis
- Kartenname
- Verkäufer
- Auktionen
- Volltextsuche

---

# Data Integrity

Die Datenbank muss Datenintegrität durch Constraints sicherstellen:

- NOT NULL, wo erforderlich
- UNIQUE für eindeutige Werte
- CHECK-Constraints für gültige Bereiche
- Foreign Keys für referenzielle Integrität

---

# End of Document