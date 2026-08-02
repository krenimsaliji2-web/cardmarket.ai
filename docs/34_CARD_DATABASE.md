# Project Atlas

# Card Database Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die zentrale Kartendatenbank von Project Atlas.

Die Card Database bildet das Herzstück der Plattform und dient als gemeinsame Datenbasis für Marketplace, KI, Sammlungen, Preisanalysen und Suchfunktionen.

Benutzer erstellen keine eigenen Kartendatensätze, sondern wählen Karten aus der zentralen Datenbank aus.

---

# Goals

Die Card Database soll:

- Alle unterstützten Trading Card Games verwalten
- Karten eindeutig identifizieren
- Varianten unterstützen
- Preisdaten bereitstellen
- KI-Erkennung ermöglichen
- Sammlungen vereinheitlichen

---

# Supported Games

Version 1 unterstützt:

- Pokémon
- Yu-Gi-Oh!
- Magic: The Gathering
- One Piece Card Game
- Disney Lorcana
- Star Wars Unlimited

Weitere Spiele können jederzeit ergänzt werden.

---

# Card Structure

Jede Karte besitzt:

- Interne ID
- Spiel
- Kartenname
- Originalname
- Set
- Kartennummer
- Seltenheit
- Sprache
- Erscheinungsdatum
- Kartentyp

---

# Card Variants

Eine Karte kann mehrere Varianten besitzen.

Beispiele:

- Normal
- Reverse Holo
- Holo
- Full Art
- Alternate Art
- Secret Rare
- Gold
- Promo
- First Edition
- Unlimited

---

# Languages

Unterstützte Sprachen:

- Deutsch
- Englisch
- Französisch
- Italienisch
- Spanisch
- Japanisch
- Koreanisch
- Chinesisch

---

# Rarity

Beispiele:

- Common
- Uncommon
- Rare
- Double Rare
- Ultra Rare
- Secret Rare
- Hyper Rare
- Illustration Rare
- Special Illustration Rare
- Promo

Die Liste kann je Spiel erweitert werden.

---

# Set Information

Jedes Set besitzt:

- Name
- Abkürzung
- Release-Datum
- Hersteller
- Anzahl Karten
- Symbol
- Logo

---

# Images

Für jede Karte können gespeichert werden:

- Vorderseite
- Rückseite
- Thumbnail
- Hochauflösende Version

---

# Grading

Unterstützte Anbieter:

- PSA
- Beckett (BGS)
- CGC

Gespeichert werden:

- Grade
- Zertifikatsnummer
- Population (optional)

---

# Price Data

Für jede Karte werden gespeichert:

- Aktueller Marktpreis
- Durchschnittspreis
- Höchstpreis
- Tiefstpreis
- Preisentwicklung

---

# AI Integration

Die KI kann:

- Karten erkennen
- Varianten unterscheiden
- Sprache erkennen
- Zustand analysieren

---

# Marketplace Integration

Inserate verweisen immer auf eine Karte aus der Card Database.

Dadurch entstehen:

- Einheitliche Daten
- Einheitliche Suche
- Einheitliche Preisanalysen

---

# Collection Integration

Benutzer können Karten direkt ihrer Sammlung hinzufügen.

Es werden keine Duplikate der Kartendaten erzeugt.

---

# Import System

Neue Karten können importiert werden.

Mögliche Quellen:

- Offizielle Herstellerdaten
- Eigene Importdateien
- Manuelle Pflege durch Administratoren

---

# Versioning

Änderungen an Kartendaten werden versioniert.

Historische Änderungen bleiben nachvollziehbar.

---

# Moderation

Administratoren können:

- Karten bearbeiten
- Karten zusammenführen
- Varianten ergänzen
- Fehler korrigieren

---

# Performance Goals

Kartensuche

< 300 ms

Kartendetails

< 200 ms

Preisdaten

< 500 ms

---

# Future Features

Geplant:

- Automatische Set-Importe
- KI-gestützte Kartenerkennung neuer Sets
- Hersteller-Synchronisation
- Mehrsprachige Kartennamen
- Verknüpfung mit offiziellen Regeltexten

---

# Definition of Done

Die Card Database gilt als abgeschlossen wenn:

✓ Alle unterstützten Spiele verwaltet werden

✓ Varianten unterstützt werden

✓ Preisdaten verfügbar sind

✓ KI integriert ist

✓ Marketplace angebunden ist

✓ Sammlungen angebunden sind

✓ Performance-Ziele erreicht werden

---

# End of Document