# Project Atlas

# Component Library

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert alle wiederverwendbaren UI-Komponenten.

Alle Seiten der Plattform müssen diese Komponenten verwenden.

Neue Komponenten dürfen nur erstellt werden, wenn keine bestehende Komponente geeignet ist.

---

# General Rules

Jede Komponente besitzt:

- TypeScript Props
- Dokumentation
- Responsive Design
- Dark Mode
- Accessibility
- Unit Tests
- Storybook Story (optional)

---

# Layout Components

## AppLayout

Verantwortlich für:

- Navigation
- Header
- Sidebar
- Footer

---

## DashboardLayout

Für eingeloggte Benutzer.

Enthält:

- Sidebar
- Topbar
- Content
- Notifications

---

## AdminLayout

Administratorbereich.

---

# Navigation Components

## Navbar

Anzeige:

- Logo
- Suche
- Marketplace
- Auktionen
- Dashboard
- Nachrichten
- Profil

---

## Sidebar

Unterstützt:

- Gruppen
- Icons
- Badges
- Collapse

---

## Mobile Navigation

Bottom Navigation

Floating Search

Hamburger Menu

---

# Search Components

## SearchBar

Live Search

Autocomplete

Keyboard Navigation

Filter Support

---

## FilterSidebar

Filter:

- Spiel
- Set
- Sprache
- Zustand
- Preis
- Verkäufer
- Bewertung
- Grading

---

# Card Components

## TradingCard

Anzeige:

- Bild
- Name
- Set
- Kartennummer
- Seltenheit

---

## ListingCard

Anzeige:

- Bild
- Preis
- Verkäufer
- Zustand
- Sprache
- Favoriten
- Auktion/Festpreis

Buttons:

- Kaufen
- Beobachten

---

## CollectionCard

Anzeige:

- Bild
- Anzahl
- Zustand
- Marktwert

---

## PortfolioCard

Anzeige:

- Wert
- Gewinn
- Verlust
- Entwicklung

---

# Auction Components

## AuctionTimer

Live Countdown

Sekundengenaue Anzeige

---

## BidHistory

Alle Gebote

---

## BidForm

Gebot eingeben

Validierung

---

# Marketplace Components

## PriceBadge

Preis

Rabatt

Trend

---

## SellerBadge

Verifiziert

Premium

Top Seller

---

## ConditionBadge

Mint

Near Mint

Excellent

Good

Played

Poor

---

# User Components

## UserAvatar

Profilbild

Fallback

Status

---

## UserCard

Profil

Bewertung

Verkäufe

Mitglied seit

---

## RatingStars

1–5 Sterne

Halbe Sterne optional

---

# Chart Components

## PriceChart

Historische Preise

---

## PortfolioChart

Portfolioentwicklung

---

## SalesChart

Verkaufsstatistik

---

# Form Components

TextInput

Textarea

Select

Checkbox

Switch

DatePicker

CurrencyInput

ImageUploader

---

# Image Components

## ImageGallery

Mehrere Bilder

Zoom

Fullscreen

---

## CardScanner

Kamera

Upload

KI-Erkennung

---

# Feedback Components

## EmptyState

Illustration

Titel

Beschreibung

Button

---

## LoadingSkeleton

Mehrere Varianten

---

## ErrorMessage

Icon

Titel

Beschreibung

Retry Button

---

## Toast

Success

Warning

Error

Info

---

# Modal Components

ConfirmationModal

DeleteModal

ImagePreviewModal

PaymentModal

OfferModal

---

# Table Components

DataTable

Pagination

ColumnFilter

SortButton

---

# Notification Components

NotificationItem

NotificationDropdown

NotificationCenter

---

# Admin Components

UserTable

ReportsTable

AuditLogTable

StatisticsCards

---

# Reusable Utilities

CopyButton

ShareButton

FavoriteButton

LanguageSelector

CurrencySelector

ThemeSwitcher

---

# Coding Rules

Keine Inline Styles.

Tailwind CSS verwenden.

Keine Logik in UI-Komponenten.

Business Logic in Services auslagern.

Alle Komponenten müssen wiederverwendbar sein.

---

# End of Document