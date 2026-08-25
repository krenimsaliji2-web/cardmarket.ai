# Project Atlas

# Database Schema

Version: 1.0

Status: Draft

---

# Purpose

Dieses Dokument definiert die komplette Datenbankstruktur der Plattform.

Jede Tabelle beschreibt:

- Spalten
- Datentypen
- Beziehungen
- Indizes
- Constraints

Die Datenbank basiert auf MariaDB.

Primärschlüssel verwenden UUID.

Alle Tabellen besitzen standardmäßig:

- id
- created_at
- updated_at

Optional:

- deleted_at (Soft Delete)

---

# TABLE: users

Beschreibung:

Speichert alle Benutzerkonten.

## Columns

id
UUID
PRIMARY KEY

email
VARCHAR(255)
UNIQUE
NOT NULL

email_verified
BOOLEAN
DEFAULT FALSE

username
VARCHAR(50)
UNIQUE

display_name
VARCHAR(100)

password_hash
TEXT

avatar_url
TEXT

banner_url
TEXT

bio
TEXT

country_id
UUID

language_id
UUID

currency_id
UUID

status

ACTIVE

BANNED

SUSPENDED

PENDING

role

USER

SELLER

MODERATOR

ADMIN

last_login_at

TIMESTAMP

created_at

TIMESTAMP

updated_at

TIMESTAMP

deleted_at

TIMESTAMP NULL

---

Indexes

email

username

status

role

---

Relationships

country_id → countries.id

language_id → languages.id

currency_id → currencies.id

---

# TABLE: user_settings

Speichert persönliche Einstellungen.

Columns

id

user_id

theme

language

currency

email_notifications

push_notifications

marketing_emails

timezone

created_at

updated_at

Relationship

user_id → users.id

ON DELETE CASCADE

---

# TABLE: roles

id

name

description

created_at

updated_at

---

# TABLE: permissions

id

name

description

module

created_at

---

# TABLE: role_permissions

role_id

permission_id

PRIMARY KEY(role_id, permission_id)

---

# TABLE: sessions

id

user_id

ip_address

device

browser

expires_at

created_at

---

# TABLE: organizations

Firmen und Händler.

Columns

id

name

slug

description

website

logo_url

country_id

verified

created_at

updated_at

---

# TABLE: organization_members

id

organization_id

user_id

role

OWNER

MANAGER

EMPLOYEE

created_at

updated_at

---

# TABLE: countries

id

iso_code

name

currency

---

# TABLE: languages

id

code

name

---

# TABLE: currencies

id

code

symbol

name