# Project Atlas

# Coding Guidelines

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die verbindlichen Entwicklungsrichtlinien für das gesamte Projekt.

Jeder geschriebene Code muss diesen Regeln entsprechen.

Das Ziel ist:

- Lesbarkeit
- Wartbarkeit
- Sicherheit
- Einheitlichkeit
- Skalierbarkeit

---

# General Principles

Code muss:

- einfach verständlich sein
- gut dokumentiert sein
- testbar sein
- wiederverwendbar sein
- möglichst wenig Abhängigkeiten besitzen

---

# Clean Code

Verwende:

- sprechende Variablennamen
- kleine Funktionen
- kleine Komponenten
- keine unnötigen Kommentare

Code soll sich möglichst selbst erklären.

---

# Naming

Dateien:

PascalCase für React-Komponenten

Beispiel:

UserCard.tsx

ListingCard.tsx

AuctionTimer.tsx

---

Hooks:

camelCase

Beispiel:

useAuth.ts

useSearch.ts

useMarketplace.ts

---

Utilities:

camelCase

Beispiel:

calculateFee.ts

formatPrice.ts

generateSlug.ts

---

# Components

Komponenten sollen:

- klein sein
- nur eine Aufgabe besitzen
- wiederverwendbar sein

Große Komponenten werden aufgeteilt.

---

# Functions

Eine Funktion erfüllt genau eine Aufgabe.

Schlecht:

createUserAndSendMailAndLog()

Gut:

createUser()

sendWelcomeMail()

writeAuditLog()

---

# TypeScript

Verwende:

- strikte Typisierung
- Interfaces oder Types
- niemals "any"

---

# Imports

Import-Reihenfolge:

1. React
2. Externe Bibliotheken
3. Interne Bibliotheken
4. Komponenten
5. Styles

---

# Error Handling

Fehler niemals ignorieren.

Alle Fehler:

- behandeln
- loggen
- verständlich anzeigen

---

# Logging

Nicht loggen:

- Passwörter
- Tokens
- Kreditkartendaten
- persönliche Informationen

---

# API

Jeder Endpoint:

- validiert Eingaben
- prüft Berechtigungen
- liefert einheitliche Antworten

---

# Database

Keine direkten SQL-Abfragen.

Prisma verwenden.

Migrationen niemals manuell ändern.

---

# Security

Benutzereingaben immer:

- validieren
- sanitieren
- escapen

---

# Performance

Vermeiden:

- unnötige Datenbankabfragen
- doppelte API-Aufrufe
- große Komponenten

---

# Accessibility

Jede neue Oberfläche unterstützt:

- Tastatur
- Screenreader
- Fokuszustände

---

# Testing

Neue Funktionen erhalten passende Tests.

Fehler müssen reproduzierbar sein.

---

# Documentation

Neue Features werden dokumentiert.

API-Änderungen ebenfalls.

---

# Git

Jeder Commit:

- klein
- verständlich
- thematisch getrennt

Beispiele:

feat(auth): add email verification

fix(search): correct filter bug

refactor(api): simplify validation

---

# Code Review

Vor jedem Merge prüfen:

- Lesbarkeit
- Sicherheit
- Performance
- Tests
- Dokumentation

---

# Definition of Done

Code gilt als fertig wenn:

✓ Build erfolgreich

✓ Tests bestanden

✓ Dokumentation aktuell

✓ Sicherheitsprüfung bestanden

✓ Code Review abgeschlossen

---

# End of Document