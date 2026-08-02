# Project Atlas

# Authentication & Authorization

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die komplette Authentifizierung, Autorisierung und Kontosicherheit.

Alle geschützten Bereiche der Plattform müssen diese Regeln befolgen.

---

# Authentication Provider

Better Auth

Unterstützt:

- E-Mail + Passwort
- Google Login
- Apple Login
- Passkeys (WebAuthn)
- Magic Links (optional)

---

# Registration

Benötigte Felder:

- Benutzername
- E-Mail
- Passwort
- Land
- Sprache
- Zustimmung AGB
- Zustimmung Datenschutz

Nach Registrierung:

- Verifizierungs-E-Mail senden
- Konto bleibt "Pending", bis E-Mail bestätigt wurde

---

# Login

Unterstützt:

- E-Mail
- Benutzername
- Google
- Apple
- Passkey

---

# Email Verification

Nach Registrierung:

- Verifizierungslink
- Token 24 Stunden gültig
- Neuer Link anforderbar

---

# Password Rules

Mindestens:

- 12 Zeichen
- 1 Großbuchstabe
- 1 Kleinbuchstabe
- 1 Zahl
- 1 Sonderzeichen

Keine bekannten kompromittierten Passwörter zulassen.

---

# Password Reset

Ablauf:

1. E-Mail eingeben
2. Reset-Link erhalten
3. Neues Passwort setzen
4. Alle anderen Sessions abmelden

---

# Multi-Factor Authentication (MFA)

Unterstützt:

- TOTP (Authenticator Apps)
- Passkeys
- Backup Codes

Pflicht für:

- Administratoren
- Moderatoren

Optional für:

- Alle Benutzer

---

# Session Management

Jeder Benutzer kann:

- aktive Geräte anzeigen
- Geräte umbenennen
- einzelne Sessions beenden
- alle Sessions beenden

Gespeicherte Informationen:

- Gerät
- Browser
- Betriebssystem
- IP-Adresse (gekürzt oder gehasht, je nach Datenschutzkonzept)
- letzter Login
- Standort (optional und nur mit transparenter Datenschutzerklärung)

---

# Login Protection

Rate Limiting

Account Lockout

Captcha nach mehreren Fehlversuchen

Verdächtige Logins erkennen

---

# Authorization

Rollen:

Guest

User

Verified Seller

Moderator

Administrator

---

# Permission System

Jede Berechtigung wird einzeln verwaltet.

Beispiele:

users.read

users.update

users.delete

cards.create

cards.update

cards.delete

orders.manage

reports.review

admin.access

---

# Seller Verification

Für Verkäufer können folgende Schritte vorgesehen werden:

- E-Mail bestätigt
- Telefonnummer bestätigt
- Identitätsprüfung (KYC), wenn gesetzlich oder durch Zahlungsanbieter erforderlich
- Bankkonto hinterlegt
- Steuerinformationen (falls erforderlich)

---

# Account Status

ACTIVE

PENDING

SUSPENDED

BANNED

DELETED

---

# Security Features

- CSRF-Schutz
- XSS-Schutz
- SQL-Injection-Schutz (ORM)
- Content Security Policy
- Sichere Cookies
- HTTPS erzwingen
- Passwort-Hashing (Argon2 oder gleichwertig)

---

# Login History

Speichern:

- Datum
- Gerät
- Browser
- Betriebssystem
- Erfolg oder Fehler

---

# Audit Logs

Protokollieren:

- Passwort geändert
- Login
- Logout
- 2FA aktiviert
- Passwort zurückgesetzt
- Rolle geändert
- Konto gesperrt

---

# Account Deletion

Benutzer kann Konto löschen.

Vor dem Löschen:

- Passwort bestätigen
- Hinweis auf Datenlöschung anzeigen
- Offene Bestellungen und Auktionen prüfen

---

# Privacy

Benutzer können:

- Daten exportieren
- Konto löschen
- Marketing-Einstellungen verwalten
- Benachrichtigungseinstellungen anpassen

---

# Definition of Done

Ein Authentifizierungsmodul gilt als fertig, wenn:

✓ Registrierung funktioniert

✓ Login funktioniert

✓ OAuth funktioniert

✓ E-Mail-Verifizierung funktioniert

✓ Passwort-Reset funktioniert

✓ MFA funktioniert

✓ Berechtigungen geprüft sind

✓ Sicherheitsprüfung bestanden ist

✓ Tests erfolgreich sind

✓ Dokumentation vollständig ist

---

# End of Document