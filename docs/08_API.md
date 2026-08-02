# Project Atlas

# API Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert sämtliche API-Endpunkte der Plattform.

Alle Frontend-Komponenten kommunizieren ausschließlich über diese API.

Direkte Datenbankzugriffe aus dem Frontend sind nicht erlaubt.

---

# API Principles

- Versioniert (v1)
- REST-kompatibel
- JSON als Standardformat
- JWT/Session-Authentifizierung
- Einheitliche Fehlerstruktur
- Pagination
- Rate Limiting
- Logging aller Requests

---

# Authentication API

POST

/api/v1/auth/register

Registrierung

---

POST

/api/v1/auth/login

Login

---

POST

/api/v1/auth/logout

Logout

---

POST

/api/v1/auth/forgot-password

Passwort zurücksetzen

---

POST

/api/v1/auth/reset-password

Neues Passwort setzen

---

GET

/api/v1/auth/me

Aktueller Benutzer

---

# User API

GET

/api/v1/users

Benutzer suchen

---

GET

/api/v1/users/{id}

Profil abrufen

---

PATCH

/api/v1/users/{id}

Profil bearbeiten

---

DELETE

/api/v1/users/{id}

Konto löschen

---

# Card API

GET

/api/v1/cards

Karten suchen

Unterstützt:

- Name
- Spiel
- Set
- Sprache
- Seltenheit
- Kartennummer

---

GET

/api/v1/cards/{id}

Kartendetails

---

GET

/api/v1/cards/{id}/prices

Preisverlauf

---

GET

/api/v1/cards/{id}/variants

Varianten

---

# Marketplace API

GET

/api/v1/listings

Alle Inserate

---

GET

/api/v1/listings/{id}

Inserat

---

POST

/api/v1/listings

Inserat erstellen

---

PATCH

/api/v1/listings/{id}

Inserat bearbeiten

---

DELETE

/api/v1/listings/{id}

Inserat löschen

---

POST

/api/v1/listings/{id}/favorite

Favorit hinzufügen

---

DELETE

/api/v1/listings/{id}/favorite

Favorit entfernen

---

# Auction API

GET

/api/v1/auctions

Aktive Auktionen

---

GET

/api/v1/auctions/{id}

Auktionsdetails

---

POST

/api/v1/auctions/{id}/bid

Gebot abgeben

---

GET

/api/v1/auctions/{id}/bids

Gebotsverlauf

---

# Orders API

GET

/api/v1/orders

Bestellungen

---

GET

/api/v1/orders/{id}

Bestellung

---

POST

/api/v1/orders

Bestellung erstellen

---

PATCH

/api/v1/orders/{id}

Status aktualisieren

---

# Payments API

POST

/api/v1/payments/create

Zahlung starten

---

POST

/api/v1/payments/webhook

Webhook

---

GET

/api/v1/payments/history

Zahlungsverlauf

---

# Chat API

GET

/api/v1/conversations

Unterhaltungen

---

POST

/api/v1/conversations

Neue Unterhaltung

---

GET

/api/v1/conversations/{id}

Chatverlauf

---

POST

/api/v1/conversations/{id}/messages

Nachricht senden

---

# Wishlist API

GET

/api/v1/wishlists

Alle Wunschlisten

---

POST

/api/v1/wishlists

Neue Wunschliste

---

PATCH

/api/v1/wishlists/{id}

Bearbeiten

---

DELETE

/api/v1/wishlists/{id}

Löschen

---

# Collection API

GET

/api/v1/collections

Sammlungen

---

POST

/api/v1/collections

Neue Sammlung

---

GET

/api/v1/collections/{id}

Details

---

PATCH

/api/v1/collections/{id}

Bearbeiten

---

DELETE

/api/v1/collections/{id}

Löschen

---

# Portfolio API

GET

/api/v1/portfolio

Portfolio

---

GET

/api/v1/portfolio/history

Historische Entwicklung

---

# AI API

POST

/api/v1/ai/scan

Karte erkennen

---

POST

/api/v1/ai/ocr

OCR starten

---

POST

/api/v1/ai/condition

Zustand analysieren

---

POST

/api/v1/ai/price

Preisvorschlag

---

# Notifications API

GET

/api/v1/notifications

Alle Benachrichtigungen

---

PATCH

/api/v1/notifications/read

Als gelesen markieren

---

# Admin API

GET

/api/v1/admin/users

Benutzerverwaltung

---

GET

/api/v1/admin/reports

Gemeldete Inhalte

---

PATCH

/api/v1/admin/reports/{id}

Bearbeiten

---

GET

/api/v1/admin/statistics

Dashboard

---

# Response Format

Erfolg:

{
  "success": true,
  "data": {}
}

Fehler:

{
  "success": false,
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "Listing wurde nicht gefunden."
  }
}

---

# Pagination

Standard:

page

limit

sort

order

---

# End of Document