# Project Atlas

# Error Handling Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert den einheitlichen Umgang mit Fehlern innerhalb der Plattform.

Alle Fehler sollen nachvollziehbar, sicher und benutzerfreundlich behandelt werden.

---

# Principles

Fehler dürfen niemals:

- die Anwendung abstürzen lassen
- vertrauliche Informationen preisgeben
- unbemerkt bleiben

Jeder Fehler muss:

- erkannt
- protokolliert
- sinnvoll behandelt

werden.

---

# Error Categories

Es gibt folgende Fehlertypen:

- Validation Errors
- Authentication Errors
- Authorization Errors
- Business Logic Errors
- Database Errors
- Network Errors
- External Service Errors
- Unknown Errors

---

# User Messages

Benutzer erhalten verständliche Fehlermeldungen.

Beispiele:

✓ Passwort ist falsch.

✓ Dieses Inserat existiert nicht mehr.

✓ Du hast keine Berechtigung für diese Aktion.

Nicht anzeigen:

❌ SQL Fehler

❌ Stack Trace

❌ Dateipfade

❌ Interne IDs

---

# Logging

Jeder Fehler wird protokolliert.

Gespeichert werden:

- Zeitpunkt
- Benutzer (falls vorhanden)
- Fehlertyp
- Nachricht
- Request-ID
- Betroffene Funktion

---

# Frontend

Das Frontend zeigt:

- Fehlermeldungen
- Ladezustände
- Wiederholen-Buttons
- Hilfreiche Hinweise

---

# Backend

Das Backend liefert:

- korrekte HTTP-Statuscodes
- standardisierte Fehlerantworten
- keine sensiblen Informationen

---

# API Error Format

Alle API-Fehler besitzen dieselbe Struktur.

Beispiel:

success: false

error:

- code
- message
- requestId

---

# Validation Errors

Beispiele:

- Pflichtfeld fehlt
- Ungültige E-Mail
- Preis negativ
- Datei zu groß

---

# Database Errors

Bei Datenbankfehlern:

- Transaktion zurückrollen
- Fehler loggen
- Benutzer informieren

---

# External Services

Fällt ein externer Dienst aus:

- Fehler loggen
- Benutzer informieren
- Erneuten Versuch ermöglichen

---

# Retry Strategy

Automatisch wiederholen bei:

- Netzwerkfehlern
- Zeitüberschreitungen
- Temporären Serverfehlern

---

# Monitoring

Alle kritischen Fehler werden an das Monitoring-System gemeldet.

---

# Security

Fehlermeldungen enthalten niemals:

- Tokens
- Passwörter
- API-Schlüssel
- Datenbankdetails

---

# Definition of Done

Das Fehlerkonzept gilt als abgeschlossen wenn:

✓ Alle Fehler protokolliert werden

✓ Einheitliche Fehlermeldungen verwendet werden

✓ Benutzer verständliche Hinweise erhalten

✓ Kritische Fehler überwacht werden

✓ Keine sensiblen Informationen ausgegeben werden

---

# End of Document