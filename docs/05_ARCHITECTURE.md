# Project Atlas

# Software Architecture

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die technische Architektur der gesamten Plattform.

Alle Entwickler und KI-Systeme müssen sich strikt an diese Architektur halten.

Abweichungen sind nur nach einer dokumentierten Architekturentscheidung (ADR) erlaubt.

---

# Architecture Principles

Project Atlas wird als **modularer Monolith** entwickelt.

Nicht als Microservice-System.

Warum?

Ein modularer Monolith ist:

- einfacher
- schneller
- günstiger
- leichter testbar
- einfacher wartbar

Alle Module werden jedoch so entwickelt, dass sie später problemlos in Microservices ausgelagert werden können.

---

# Core Principles

Jedes Modul besitzt:

- eigene Logik
- eigene Services
- eigene Datenmodelle
- eigene Tests
- klare Schnittstellen

Module kommunizieren niemals direkt über die Datenbank.

Module kommunizieren ausschließlich über Services oder Events.

---

# Technology Stack

Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

Backend

- Next.js Server Actions
- tRPC
- Prisma ORM

Database

- MariaDB

Authentication

- Better Auth (oder vergleichbare moderne Lösung)
- OAuth
- Passkeys
- Google Login
- Apple Login

Storage

- Cloudflare R2

Search

- Meilisearch

Cache

- Redis

Realtime

- WebSockets

Queue

- BullMQ

Monitoring

- Sentry

Analytics

- PostHog

Deployment

- Docker

CI/CD

- GitHub Actions

---

# Folder Structure

apps/

packages/

docs/

scripts/

public/

---

Inside src/

app/

components/

features/

hooks/

lib/

services/

types/

utils/

styles/

config/

middleware/

emails/

jobs/

events/

---

# Feature Based Structure

Jede Hauptfunktion besitzt einen eigenen Bereich.

Zum Beispiel:

features/auth

features/users

features/cards

features/marketplace

features/auctions

features/orders

features/payments

features/chat

features/admin

features/search

features/portfolio

features/collection

features/notifications

features/analytics

---

# Shared Components

Gemeinsame Komponenten befinden sich ausschließlich unter:

components/

Keine Duplikate.

---

# Services

Business Logic gehört niemals in React Components.

Business Logic gehört niemals in Pages.

Business Logic gehört ausschließlich in Services.

---

# API

Die API ist versioniert.

v1

Später:

v2

v3

---

# Database Access

Die Datenbank wird ausschließlich über Prisma angesprochen.

Direkte SQL Queries sind nur erlaubt, wenn Prisma keine ausreichende Performance bietet.

---

# Images

Alle Bilder werden außerhalb der Datenbank gespeichert.

Cloudflare R2.

Die Datenbank speichert ausschließlich URLs und Metadaten.

---

# Background Jobs

Folgende Prozesse laufen im Hintergrund:

Preisaktualisierung

Benachrichtigungen

E-Mails

Bildverarbeitung

KI-Verarbeitung

Statistiken

Suchindex aktualisieren

Portfolio berechnen

---

# Events

Das System arbeitet eventbasiert.

Beispiele:

UserCreated

AuctionStarted

AuctionEnded

OrderPaid

OrderCancelled

CardUploaded

AIRecognitionFinished

ImageProcessed

---

# Logging

Jede Aktion wird protokolliert.

Nicht nur Fehler.

Auch:

Logins

Zahlungen

Gebote

Admin Aktionen

Änderungen

---

# Error Handling

Jeder Fehler besitzt:

Code

Beschreibung

Kategorie

Lösung

Logging

Keine kryptischen Fehlermeldungen.

---

# Security

Security First.

Nie zuletzt.

Jede Funktion muss vor Missbrauch geschützt sein.

---

# Performance

Performance ist kein späteres Thema.

Performance gehört zur Architektur.

Alle Seiten sollen innerhalb weniger Sekunden laden.

---

# Scalability

Das System muss später unterstützen:

10 Millionen Karten

500'000 Benutzer

100'000 gleichzeitige Besucher

Mehrere Server

Load Balancer

CDN

---

# AI Integration

KI ist kein Zusatzmodul.

KI gehört zur Kernarchitektur.

Jedes KI-Modul wird unabhängig entwickelt.

---

# Documentation

Jedes Modul erhält:

README

Tests

API Dokumentation

Architekturdiagramm

---

# Coding Standards

Clean Code

SOLID

DRY

KISS

Type Safety

Strict TypeScript

Keine Any Types.

---

# Definition of Done

Ein Modul gilt erst als fertig wenn:

✔ Code geschrieben

✔ Tests bestanden

✔ Dokumentation erstellt

✔ Performance geprüft

✔ Security geprüft

✔ Review abgeschlossen

---

# End of Document