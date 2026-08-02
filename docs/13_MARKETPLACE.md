# Project Atlas

# Marketplace Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert sämtliche Funktionen des Marktplatzes.

Alle Kauf- und Verkaufsprozesse müssen diesen Spezifikationen folgen.

---

# Marketplace Goals

Der Marktplatz soll:

- schnell
- sicher
- transparent
- einfach
- vertrauenswürdig

sein.

---

# Supported Listing Types

## Fixed Price

Sofort kaufen.

---

## Auction

Zeitlich begrenzte Auktion.

---

## Best Offer

Preisvorschläge zwischen Käufer und Verkäufer.

---

# Create Listing

Pflichtfelder:

- Karte auswählen
- Zustand
- Sprache
- Menge
- Preis
- Versandoptionen
- Bilder
- Beschreibung

Optional:

- Mindestpreis
- Sofort-Kaufen
- Preis verhandelbar
- Interne Notizen

---

# Listing Workflow

1. Entwurf erstellen

↓

2. Bilder hochladen

↓

3. Vorschau anzeigen

↓

4. Veröffentlichen

↓

5. Inserat aktiv

↓

6. Verkauf oder Ablauf

---

# Listing Status

DRAFT

ACTIVE

PAUSED

SOLD

ENDED

DELETED

UNDER_REVIEW

---

# Listing Images

Mindestens:

1 Bild

Maximal:

20 Bilder

Automatische Optimierung:

- WebP
- Thumbnail
- Original speichern

---

# Seller Dashboard

Zeigt:

- Aktive Inserate
- Verkäufe
- Einnahmen
- Besucher
- Beobachter
- Preisvorschläge
- Auktionen
- Lagerbestand

---

# Buyer Dashboard

Zeigt:

- Käufe
- Beobachtete Karten
- Wunschlisten
- Nachrichten
- Rückerstattungen
- Bestellungen

---

# Buying Process

1. Karte auswählen

↓

2. Warenkorb

↓

3. Versand wählen

↓

4. Zahlungsmethode

↓

5. Bestellung prüfen

↓

6. Zahlung

↓

7. Bestätigung

---

# Shopping Cart

Unterstützt:

- mehrere Verkäufer
- mehrere Karten
- Mengenänderung
- Gutscheine (später)
- Versandberechnung

---

# Offers

Preisvorschläge können:

- angenommen
- abgelehnt
- gekontert

werden.

Ablaufdatum:

72 Stunden.

---

# Seller Tools

Verkäufer können:

- Preis ändern
- Inserat pausieren
- Lagerbestand anpassen
- Preisvorschläge beantworten
- Versandinformationen hinzufügen
- Mehrere Inserate gleichzeitig bearbeiten

---

# Shipping

Unterstützt:

- Standard
- Einschreiben
- Express
- Abholung

Später:

Versandetiketten direkt erstellen.

---

# Order Status

PENDING

PAID

PROCESSING

SHIPPED

DELIVERED

COMPLETED

CANCELLED

REFUNDED

---

# Fees

Standard:

10 %

Gebühr.

Gebühren werden automatisch berechnet.

---

# Seller Ratings

Berechnet aus:

- Bewertungen
- Verkaufsanzahl
- Antwortzeit
- Versandzeit
- Stornierungsquote

---

# Buyer Protection

Käufer können:

- Problem melden
- Rückerstattung beantragen
- Verkäufer kontaktieren

---

# Fraud Prevention

Automatische Erkennung:

- doppelte Inserate
- gestohlene Bilder
- ungewöhnliche Preisabweichungen
- verdächtige Konten
- Bot-Aktivitäten

---

# Inventory Synchronization

Nach Verkauf:

Bestand automatisch aktualisieren.

Keine Überverkäufe zulassen.

---

# Search Ranking

Sortierung berücksichtigt:

- Relevanz
- Preis
- Verkäuferbewertung
- Aktualität
- Beliebtheit

---

# Notifications

Benachrichtigungen bei:

- Verkauf
- Preisvorschlag
- Gebot
- Zahlung
- Versand
- Bewertung

---

# Reports

Jedes Inserat kann gemeldet werden.

Gründe:

- Fälschung
- Betrug
- Falsche Beschreibung
- Unzulässiger Inhalt
- Spam

---

# Definition of Done

Das Marketplace-Modul gilt als abgeschlossen, wenn:

✓ Inserate erstellt werden können

✓ Käufe funktionieren

✓ Preisvorschläge funktionieren

✓ Warenkorb funktioniert

✓ Gebühren korrekt berechnet werden

✓ Versand verwaltet wird

✓ Bewertungen möglich sind

✓ Betrugserkennung aktiv ist

✓ Tests erfolgreich sind

✓ Dokumentation vollständig ist

---

# End of Document