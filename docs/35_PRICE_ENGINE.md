# Project Atlas

# Price Engine Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die Preis-Engine von Project Atlas.

Die Price Engine berechnet Marktpreise, analysiert Preisentwicklungen und unterstützt Käufer sowie Verkäufer bei Preisentscheidungen.

Sie dient ausschließlich als Orientierungshilfe und ersetzt keine verbindliche Preisfestlegung.

---

# Goals

Die Price Engine soll:

- aktuelle Marktpreise berechnen
- historische Preise speichern
- Preisentwicklungen darstellen
- Preisalarme ermöglichen
- Verkäufer unterstützen
- Käufern Transparenz bieten

---

# Price Sources

Der Marktpreis basiert auf:

- Erfolgreich abgeschlossenen Verkäufen
- Aktiven Inseraten
- Auktionsverkäufen
- Kartenzustand
- Sprache
- Variante
- Grading

Jede Datenquelle kann unterschiedlich gewichtet werden.

---

# Market Price

Für jede Karte wird berechnet:

- Aktueller Marktpreis
- Durchschnittspreis
- Medianpreis
- Höchstpreis
- Tiefstpreis

---

# Historical Prices

Preisverlauf:

- 24 Stunden
- 7 Tage
- 30 Tage
- 90 Tage
- 1 Jahr
- Gesamte Historie

---

# Price Charts

Diagramme zeigen:

- Preisentwicklung
- Verkaufsvolumen
- Durchschnittspreis
- Höchstpreis
- Tiefstpreis

---

# Market Trends

Die Plattform erkennt:

- steigende Preise
- fallende Preise
- stabile Preise
- ungewöhnliche Marktbewegungen

---

# Price Suggestions

Beim Erstellen eines Inserats erhält der Verkäufer:

- Empfohlenen Verkaufspreis
- Empfohlenen Mindestpreis
- Empfohlenen Auktionsstartpreis

Der Verkäufer entscheidet selbst über den endgültigen Preis.

---

# Buyer Information

Käufer sehen:

- Marktpreis
- Preisentwicklung
- Durchschnittspreis
- Preis pro Zustand
- Preis pro Sprache

---

# Condition Adjustment

Preisberechnung berücksichtigt:

- Mint
- Near Mint
- Excellent
- Good
- Played
- Poor

---

# Grading Adjustment

Unterstützt:

- PSA
- BGS
- CGC

Grading beeinflusst die Preisanalyse.

---

# Variant Adjustment

Unterschiedliche Varianten besitzen eigene Preisdaten.

Beispiele:

- Normal
- Reverse Holo
- Full Art
- Alternate Art
- Promo
- First Edition

---

# Currency

Preise werden intern konsistent gespeichert.

Angezeigt werden:

- CHF
- EUR

Weitere Währungen können ergänzt werden.

---

# Price Alerts

Benutzer können Preisalarme erstellen.

Beispiele:

- Preis unter 100 CHF
- Preis über 500 EUR
- Neue Tiefstpreise
- Neue Höchstpreise

---

# Seller Analytics

Verkäufer sehen:

- Durchschnittlicher Verkaufspreis
- Preisentwicklung ihrer Verkäufe
- Erfolgsquote verschiedener Preisstrategien

---

# AI Support

Die KI unterstützt bei:

- Preisvorschlägen
- Marktanalyse
- Erkennung ungewöhnlicher Preisentwicklungen
- Prognosen auf Basis historischer Daten

Alle KI-Ergebnisse dienen als Empfehlung.

---

# Outlier Detection

Ungewöhnliche Preise können erkannt werden.

Beispiele:

- Extrem niedrige Preise
- Extrem hohe Preise
- Verdächtige Marktmanipulationen

Diese Daten werden überprüft und bei Bedarf von Preisanalysen ausgeschlossen.

---

# Refresh Cycle

Marktpreise werden regelmäßig aktualisiert.

Die Häufigkeit richtet sich nach:

- Handelsvolumen
- Kartenpopularität
- Verfügbarkeit neuer Verkaufsdaten

---

# API Integration

Die Preisdaten stehen internen Modulen zur Verfügung:

- Marketplace
- AI
- Collection Manager
- Portfolio
- Mobile App

---

# Performance Goals

Preisabfrage

< 300 ms

Preisdiagramm

< 500 ms

Preisvorschlag

< 2 Sekunden

---

# Future Features

Geplant:

- Preisprognosen
- Saisonale Marktanalysen
- Preisvergleich zwischen Regionen
- Seltenheitsindex
- Volatilitätsindex
- Individuelle Preisstrategien

---

# Definition of Done

Die Price Engine gilt als abgeschlossen wenn:

✓ Marktpreise berechnet werden

✓ Preisverläufe verfügbar sind

✓ Preisdiagramme funktionieren

✓ Preisalarme erstellt werden können

✓ KI-Preisvorschläge verfügbar sind

✓ Performance-Ziele erreicht werden

✓ Tests erfolgreich sind

---

# End of Document