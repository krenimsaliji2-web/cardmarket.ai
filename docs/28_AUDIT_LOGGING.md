# Project Atlas

# Audit Logging Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert das Audit-Logging der Plattform.

Alle sicherheitsrelevanten und geschäftskritischen Aktionen werden nachvollziehbar protokolliert.

Das Audit-Log dient:

- Nachvollziehbarkeit
- Sicherheit
- Fehleranalyse
- Compliance
- Betrugserkennung

---

# Principles

Audit-Logs müssen:

- vollständig sein
- manipulationssicher sein
- zeitlich korrekt sein
- durchsuchbar sein

Logs dürfen nachträglich nicht verändert werden.

---

# Logged Events

## Authentication

- Registrierung
- Login
- Logout
- Passwort geändert
- Passwort zurückgesetzt
- MFA aktiviert
- MFA deaktiviert
- Passkey hinzugefügt
- Passkey entfernt

---

## User

- Profil geändert
- E-Mail geändert
- Telefonnummer geändert
- Konto gelöscht
- Konto deaktiviert

---

## Marketplace

- Inserat erstellt
- Inserat geändert
- Inserat gelöscht
- Preis geändert
- Inserat pausiert
- Inserat verkauft

---

## Auctions

- Auktion erstellt
- Gebot abgegeben
- Gebot zurückgezogen
- Auktion beendet
- Gewinner bestimmt

---

## Orders

- Bestellung erstellt
- Bestellung storniert
- Bestellung abgeschlossen
- Versand bestätigt

---

## Payments

- Zahlung gestartet
- Zahlung erfolgreich
- Zahlung fehlgeschlagen
- Rückerstattung
- Auszahlung gestartet
- Auszahlung abgeschlossen

---

## AI

- Kartenscan durchgeführt
- OCR gestartet
- Preisanalyse erstellt
- Fake Detection ausgeführt

---

## Administration

- Benutzer gesperrt
- Benutzer entsperrt
- Rolle geändert
- Meldung bearbeitet
- Auszahlung freigegeben
- Einstellungen geändert

---

## System

- Deployment
- Backup
- Wartungsmodus aktiviert
- Wartungsmodus deaktiviert
- Fehler erkannt

---

# Stored Information

Jeder Audit-Eintrag enthält:

- Event-ID
- Zeitstempel
- Benutzer-ID
- Rolle
- Aktion
- Objekt
- Objekt-ID
- IP-Adresse (gemäß Datenschutzkonzept)
- User-Agent
- Request-ID
- Ergebnis

---

# Severity Levels

Information

Warning

Error

Critical

---

# Search

Administratoren können filtern nach:

- Benutzer
- Datum
- Aktion
- Kategorie
- Objekt
- Schweregrad

---

# Retention

Audit-Logs werden langfristig gespeichert.

Die Aufbewahrungsdauer richtet sich nach den geltenden gesetzlichen und betrieblichen Anforderungen.

---

# Export

Administratoren können Audit-Logs exportieren.

Unterstützte Formate:

- CSV
- JSON

---

# Monitoring

Kritische Ereignisse erzeugen sofortige Warnungen.

Beispiele:

- Mehrere fehlgeschlagene Logins
- Viele Kontosperrungen
- Verdächtige Admin-Aktionen
- Ungewöhnliche Zahlungsaktivitäten

---

# Privacy

Audit-Logs enthalten keine:

- Passwörter
- Tokens
- Kreditkartendaten
- API-Schlüssel

Personenbezogene Daten werden auf das notwendige Maß beschränkt.

---

# Performance Goals

Schreiben eines Audit-Eintrags:

< 50 ms

Suche:

< 500 ms

Export:

< 10 Sekunden

---

# Definition of Done

Das Audit-Logging gilt als abgeschlossen wenn:

✓ Alle kritischen Aktionen protokolliert werden

✓ Logs durchsuchbar sind

✓ Export funktioniert

✓ Monitoring integriert ist

✓ Datenschutz eingehalten wird

✓ Performance-Ziele erreicht werden

---

# End of Document