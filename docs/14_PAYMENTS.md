# Project Atlas

# Payments Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert alle Zahlungsprozesse der Plattform.

Das Ziel ist eine sichere, transparente und nachvollziehbare Zahlungsabwicklung.

---

# Payment Provider

Primärer Zahlungsanbieter:

Stripe Connect

Später optional:

- PayPal
- TWINT
- Apple Pay
- Google Pay

---

# Supported Currencies

CHF

EUR

Weitere Währungen können später ergänzt werden.

---

# Payment Methods

Unterstützt werden:

- Kreditkarte
- Debitkarte
- Apple Pay
- Google Pay
- TWINT (Schweiz)
- SEPA (EU)

---

# Payment Flow

1. Käufer bestätigt Bestellung

↓

2. Zahlung wird autorisiert

↓

3. Bestellung wird erstellt

↓

4. Verkäufer wird informiert

↓

5. Verkäufer versendet Ware

↓

6. Lieferung bestätigt

↓

7. Auszahlung an Verkäufer

---

# Platform Fee

Standardgebühr:

10 %

Beispiel:

Artikelpreis: CHF 100

Plattformgebühr: CHF 10

Auszahlung Verkäufer: CHF 90

---

# Seller Payouts

Auszahlungen erfolgen:

- automatisch
- manuell (optional)

Status:

PENDING

PROCESSING

COMPLETED

FAILED

---

# Refunds

Rückerstattungen können erfolgen:

- vollständig
- teilweise

Gründe:

- Ware nicht erhalten
- Artikel entspricht nicht der Beschreibung
- Einvernehmliche Stornierung

---

# Disputes

Bei Streitfällen:

1. Käufer meldet Problem

2. Verkäufer antwortet

3. Moderation prüft den Fall

4. Entscheidung wird dokumentiert

---

# Chargebacks

Bei Rückbuchungen:

- Fall dokumentieren
- Verkäufer informieren
- Zahlungsstatus aktualisieren
- Risikoanalyse durchführen

---

# Seller Verification (KYC)

Je nach gesetzlichen Anforderungen:

- Identitätsnachweis
- Bankkonto
- Steuerinformationen
- Adressnachweis

---

# Invoices

Automatisch erzeugen:

- Kaufbeleg
- Gebührenübersicht
- Auszahlungsübersicht

PDF-Export unterstützen.

---

# Taxes

System unterstützt:

- Schweizer MWST
- EU-Mehrwertsteuer
- Steuerfreie Verkäufe (wenn zulässig)

Steuersätze sollen konfigurierbar sein.

---

# Security

Alle Zahlungsdaten:

- verschlüsselt übertragen
- keine Speicherung sensibler Kartendaten
- PCI-DSS-konforme Zahlungsabwicklung über Zahlungsanbieter

---

# Audit Trail

Jede Zahlung protokolliert:

- Autorisierung
- Zahlung
- Rückerstattung
- Auszahlung
- Chargeback

---

# Notifications

Benachrichtigungen bei:

- Zahlung erfolgreich
- Zahlung fehlgeschlagen
- Auszahlung erfolgt
- Rückerstattung abgeschlossen
- Streitfall eröffnet

---

# Failure Handling

Falls Zahlung fehlschlägt:

- Bestellung bleibt offen
- Benutzer erhält Fehlermeldung
- Neuer Zahlungsversuch möglich

---

# Reporting

Administrator sieht:

- Umsatz
- Gebühren
- Rückerstattungen
- Chargebacks
- Auszahlungen
- Offene Zahlungen

---

# Definition of Done

Das Zahlungsmodul gilt als abgeschlossen, wenn:

✓ Zahlungen funktionieren

✓ Gebühren korrekt berechnet werden

✓ Auszahlungen möglich sind

✓ Rückerstattungen funktionieren

✓ Streitfälle dokumentiert werden

✓ Rechnungen erstellt werden

✓ Sicherheitsprüfung bestanden ist

✓ Tests erfolgreich sind

---

# End of Document