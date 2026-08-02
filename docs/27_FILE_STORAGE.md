# Project Atlas

# File Storage Specification

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die Speicherung, Verarbeitung und Verwaltung aller Dateien innerhalb der Plattform.

Ziel ist eine sichere, skalierbare und kosteneffiziente Dateiverwaltung.

---

# Storage Provider

Für die Speicherung wird verwendet:

Cloudflare R2

Gründe:

- Hohe Skalierbarkeit
- Geringe Kosten
- S3-kompatible API
- Weltweite Verfügbarkeit
- Gute Integration mit Cloudflare CDN

---

# File Types

Unterstützt werden:

## Images

- JPG
- JPEG
- PNG
- WEBP
- AVIF (optional)

---

## Documents

- PDF

Weitere Dateitypen können später ergänzt werden.

---

# Upload Limits

## Profile Images

Maximal:

10 MB

---

## Card Images

Maximal:

20 MB

Bis zu:

20 Bilder pro Inserat

---

## Documents

Maximal:

25 MB

---

# Storage Structure

Alle Dateien werden logisch getrennt.

Beispiel:

users/

listings/

cards/

documents/

temp/

exports/

system/

---

# Image Processing

Nach dem Upload werden automatisch:

- Dateityp geprüft
- Größe geprüft
- Metadaten entfernt
- Vorschaubilder erstellt
- Bild optimiert
- Original gespeichert

---

# Generated Versions

Für Bilder werden automatisch erzeugt:

Thumbnail

Small

Medium

Large

Original

---

# File Naming

Dateinamen werden niemals direkt übernommen.

Verwendet werden:

UUIDs

Beispiel:

550e8400-e29b-41d4-a716-446655440000.webp

---

# Duplicate Detection

Identische Dateien können erkannt werden.

Hash-Werte werden gespeichert.

Doppelte Dateien können mehrfach referenziert werden, ohne sie erneut hochzuladen.

---

# Virus Scan

Alle Uploads werden automatisch geprüft.

Verdächtige Dateien werden:

- blockiert
- protokolliert
- nicht veröffentlicht

---

# Access Control

Öffentliche Dateien:

- Kartenbilder
- Vorschaubilder

Private Dateien:

- Rechnungen
- Ausweisdokumente
- Verifizierungsunterlagen

---

# Temporary Uploads

Nicht abgeschlossene Uploads werden automatisch gelöscht.

Standard:

24 Stunden

---

# Delete Policy

Beim Löschen eines Datensatzes:

- Referenzen prüfen
- Dateien entfernen, wenn sie nicht mehr verwendet werden
- Löschvorgang protokollieren

---

# CDN

Alle öffentlichen Bilder werden über Cloudflare ausgeliefert.

Vorteile:

- Schnellere Ladezeiten
- Geringere Serverlast
- Weltweite Verfügbarkeit

---

# Backup Strategy

Dateien werden regelmäßig gesichert.

Backups werden:

- verschlüsselt
- geprüft
- versioniert

---

# Metadata

Gespeichert werden:

- Dateigröße
- Dateityp
- Bildabmessungen
- Upload-Datum
- Besitzer
- Hash

---

# Performance Goals

Bild-Upload

< 5 Sekunden

Thumbnail-Erstellung

< 2 Sekunden

Bildauslieferung

< 300 ms

---

# Security

Dateien dürfen niemals direkt über den Dateinamen erreichbar sein.

Zugriffe werden über Berechtigungen geprüft.

Private Dateien erhalten zeitlich begrenzte Zugriffstoken.

---

# Future Features

Geplant:

- KI-Bildverbesserung
- Automatische Hintergrundentfernung
- Mehrfach-Upload per Drag & Drop
- ZIP-Import
- Video-Unterstützung

---

# Definition of Done

Das Dateisystem gilt als abgeschlossen wenn:

✓ Upload funktioniert

✓ Bildoptimierung funktioniert

✓ Thumbnails erstellt werden

✓ Zugriffsrechte korrekt geprüft werden

✓ Dateien sicher gespeichert werden

✓ Backups eingerichtet sind

✓ Performance-Ziele erreicht werden

---

# End of Document