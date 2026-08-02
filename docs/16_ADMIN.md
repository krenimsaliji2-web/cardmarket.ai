# Project Atlas

# Administration Panel

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert das komplette Administrationssystem der Plattform.

Administratoren erhalten Werkzeuge zur Verwaltung von Benutzern, Karten, Inseraten, Zahlungen, KI-Modulen und Systemeinstellungen.

Alle Aktionen werden revisionssicher protokolliert.

---

# Admin Dashboard

Das Dashboard zeigt in Echtzeit:

- Registrierte Benutzer
- Aktive Verkäufer
- Neue Inserate
- Laufende Auktionen
- Verkäufe heute
- Umsatz heute
- Plattformgebühren
- Offene Meldungen
- Offene Streitfälle
- Fehlgeschlagene Zahlungen
- Systemstatus

---

# User Management

Administratoren können:

- Benutzer suchen
- Profil anzeigen
- Konto sperren
- Konto entsperren
- Rolle ändern
- E-Mail bestätigen
- Passwort zurücksetzen
- Verkäufer verifizieren
- Konto löschen

Anzeige:

- Benutzername
- E-Mail
- Registrierungsdatum
- Letzter Login
- Anzahl Verkäufe
- Anzahl Käufe
- Status

---

# Seller Management

Administratoren können:

- Verkäufer freischalten
- Verkäufer sperren
- Verifizierungen prüfen
- Auszahlung stoppen
- Händlerstatus vergeben

---

# Marketplace Management

Administratoren können:

- Inserate suchen
- Inserate bearbeiten
- Inserate deaktivieren
- Inserate löschen
- Kategorien verwalten
- Karten zusammenführen
- Karten korrigieren

---

# Auction Management

Administratoren können:

- Auktionen beenden
- Auktionen pausieren
- Auktionen löschen
- Gebote prüfen
- Manipulationen untersuchen

---

# Payment Management

Anzeige:

- Zahlungen
- Gebühren
- Rückerstattungen
- Chargebacks
- Auszahlungen

Administratoren können:

- Rückerstattungen freigeben
- Auszahlungen prüfen
- Zahlungsstatus korrigieren

---

# Moderation

Anzeige:

- Gemeldete Inserate
- Gemeldete Benutzer
- Gemeldete Nachrichten
- Gemeldete Bilder

Aktionen:

- Verwarnung
- Sperrung
- Löschung
- Ablehnung der Meldung

---

# AI Management

Administratoren sehen:

- KI-Auslastung
- Fehlgeschlagene Analysen
- Erkennungsquote
- OCR-Ergebnisse
- Confidence Scores

Optional:

- Manuelle Nachprüfung
- Modellversion anzeigen

---

# Analytics Dashboard

Kennzahlen:

- Umsatz
- Provisionen
- Neue Benutzer
- Aktive Benutzer
- Verkäufe pro Tag
- Beliebteste Spiele
- Beliebteste Karten
- Durchschnittlicher Verkaufspreis
- Conversion Rate

Diagramme:

- Umsatz
- Registrierungen
- Verkäufe
- Auktionen
- KI-Nutzung

---

# Audit Logs

Alle Administratoraktionen werden gespeichert.

Beispiele:

- Benutzer gesperrt
- Rolle geändert
- Auszahlung freigegeben
- Inserat gelöscht
- Einstellungen geändert

Jeder Eintrag enthält:

- Administrator
- Aktion
- Zeitpunkt
- Betroffenes Objekt
- IP-Adresse (gemäß Datenschutzkonzept)

---

# System Settings

Konfigurierbar:

- Plattformgebühr
- Unterstützte Währungen
- Unterstützte Sprachen
- Upload-Limits
- Max. Bilder pro Inserat
- Wartungsmodus
- Feature Flags

---

# Email Center

Administratoren können:

- Newsletter erstellen
- System-E-Mails testen
- Vorlagen bearbeiten

---

# Content Management

Bearbeitbar:

- Startseite
- Hilfeseiten
- FAQ
- Blog
- Rechtstexte
- Banner

---

# Security Dashboard

Anzeige:

- Fehlgeschlagene Logins
- Verdächtige Aktivitäten
- Gesperrte IP-Adressen
- Offene Sicherheitswarnungen

---

# Backup & Recovery

Administratoren können:

- Backup starten
- Backup herunterladen
- Wiederherstellung auslösen

Nur für Super-Administratoren.

---

# Feature Flags

Neue Funktionen können aktiviert oder deaktiviert werden.

Beispiele:

- KI Scanner
- Auktionen
- Händlerkonto
- API
- Mobile App
- Beta-Funktionen

---

# Maintenance Mode

Aktivieren:

- Wartungsnachricht
- Geplanter Zeitraum
- Ausnahme für Administratoren

---

# Roles

ADMIN

SUPER_ADMIN

Nur SUPER_ADMIN darf:

- Rollen ändern
- System löschen
- Backups wiederherstellen
- Zahlungsanbieter konfigurieren

---

# Definition of Done

Das Admin-Modul gilt als abgeschlossen, wenn:

✓ Benutzer verwaltet werden können

✓ Inserate moderiert werden können

✓ Zahlungen überwacht werden können

✓ KI überwacht werden kann

✓ Statistiken verfügbar sind

✓ Logs vollständig sind

✓ Sicherheit geprüft wurde

✓ Dokumentation abgeschlossen ist

---

# End of Document