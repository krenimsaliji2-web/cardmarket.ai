# Project Atlas

# Contributing Guide

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die Regeln für die Zusammenarbeit an Project Atlas.

Alle Mitwirkenden – Menschen und KI-gestützte Entwicklungswerkzeuge – halten sich an diese Richtlinien.

Ziele:

- Einheitlicher Code
- Hohe Qualität
- Nachvollziehbare Änderungen
- Sichere Releases

---

# Development Workflow

Jede neue Funktion folgt diesem Ablauf:

1. Dokumentation prüfen
2. Feature Branch erstellen
3. Implementierung
4. Tests schreiben
5. Code Review
6. Fehler beheben
7. Merge
8. Deployment

---

# Branch Strategy

## main

Produktionscode.

Nur stabile Versionen.

---

## develop

Aktuelle Entwicklungsbasis.

Alle neuen Funktionen werden zuerst hier integriert.

---

## feature/*

Neue Funktionen.

Beispiele:

feature/auth

feature/marketplace

feature/ai-scanner

feature/notifications

---

## fix/*

Normale Fehlerbehebungen.

Beispiel:

fix/login

---

## hotfix/*

Kritische Fehler in der Produktion.

Werden direkt in main behoben.

---

# Commit Convention

Commits müssen eindeutig sein.

Beispiele:

feat(auth): add passkey login

feat(search): implement autocomplete

fix(payment): correct fee calculation

fix(api): validate order input

docs(ai): update scanner specification

refactor(database): simplify queries

test(auth): add login tests

---

# Pull Requests

Jeder Pull Request enthält:

- Beschreibung
- Betroffene Module
- Screenshots (bei UI-Änderungen)
- Teststatus
- Verknüpfte Aufgabe

---

# Code Review

Vor jedem Merge prüfen:

- Funktionalität
- Lesbarkeit
- Performance
- Sicherheit
- Dokumentation
- Tests

---

# Testing

Vor jedem Merge müssen erfolgreich sein:

- Type Check
- Linter
- Unit Tests
- Integration Tests

Für Releases zusätzlich:

- End-to-End Tests
- Performance Tests
- Security Scan

---

# Documentation

Jede neue Funktion muss dokumentiert werden.

Geänderte Funktionen aktualisieren die bestehende Dokumentation.

---

# Dependencies

Neue Bibliotheken dürfen nur verwendet werden wenn:

- aktiv gepflegt
- dokumentiert
- sicher
- sinnvoll

Unnötige Abhängigkeiten vermeiden.

---

# Security

Neue Funktionen müssen:

- Berechtigungen prüfen
- Eingaben validieren
- Fehler sicher behandeln
- Sicherheitsrichtlinien einhalten

---

# Performance

Neue Funktionen dürfen:

- Ladezeiten nicht deutlich erhöhen
- unnötige Datenbankabfragen vermeiden
- Caching berücksichtigen

---

# Release Process

Vor einem Release:

✓ Dokumentation aktuell

✓ Tests erfolgreich

✓ Code Review abgeschlossen

✓ Sicherheitsprüfung bestanden

✓ Performance geprüft

---

# Versioning

Semantic Versioning wird verwendet.

MAJOR

Nicht kompatible Änderungen.

MINOR

Neue Funktionen.

PATCH

Fehlerbehebungen.

Beispiele:

1.0.0

1.1.0

1.1.1

2.0.0

---

# Working with Claude Code

Claude Code dient als Entwicklungsassistent.

Grundregeln:

- Bestehenden Code verbessern statt neu schreiben.
- Dokumentation vor der Implementierung lesen.
- Architekturentscheidungen respektieren.
- Keine unnötigen Bibliotheken hinzufügen.
- Einheitlichen Coding Style einhalten.
- Tests für neue Funktionen erstellen.
- Änderungen nachvollziehbar dokumentieren.

---

# Definition of Done

Eine Änderung gilt als abgeschlossen wenn:

✓ Code implementiert

✓ Tests bestanden

✓ Dokumentation aktualisiert

✓ Code Review abgeschlossen

✓ Sicherheitsprüfung bestanden

✓ Performance überprüft

---

# End of Document