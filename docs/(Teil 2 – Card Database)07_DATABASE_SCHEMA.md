---

# TABLE: games

Beschreibung:

Alle unterstützten Trading Card Games.

## Columns

id
UUID
PRIMARY KEY

name
VARCHAR(100)
UNIQUE
NOT NULL

slug
VARCHAR(100)
UNIQUE

manufacturer
VARCHAR(100)

description
TEXT

logo_url
TEXT

is_active
BOOLEAN
DEFAULT TRUE

created_at
TIMESTAMP

updated_at
TIMESTAMP

---

# TABLE: card_sets

Beschreibung:

Alle Kartensets.

## Columns

id
UUID

game_id
UUID

name
VARCHAR(255)

code
VARCHAR(50)

release_date
DATE

symbol_url
TEXT

logo_url
TEXT

total_cards
INTEGER

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationship

game_id → games.id

---

# TABLE: rarities

Beschreibung:

Seltenheitsstufen.

## Columns

id
UUID

name
VARCHAR(100)

short_name
VARCHAR(20)

color
VARCHAR(20)

created_at
TIMESTAMP

---

# TABLE: artists

Beschreibung:

Illustratoren.

## Columns

id
UUID

name
VARCHAR(255)

website
TEXT

created_at
TIMESTAMP

---

# TABLE: cards

Beschreibung:

Master-Datenbank aller Karten.

## Columns

id
UUID

game_id
UUID

set_id
UUID

artist_id
UUID

rarity_id
UUID

card_number
VARCHAR(30)

name
VARCHAR(255)

local_name
VARCHAR(255)

description
TEXT

hp
INTEGER

card_type
VARCHAR(100)

subtype
VARCHAR(100)

stage
VARCHAR(50)

element
VARCHAR(50)

is_holo
BOOLEAN

is_reverse
BOOLEAN

is_secret
BOOLEAN

is_promo
BOOLEAN

release_date
DATE

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

game_id → games.id

set_id → card_sets.id

artist_id → artists.id

rarity_id → rarities.id

---

Indexes

name

card_number

game_id

set_id

rarity_id

---

# TABLE: card_images

Beschreibung:

Alle Bilder einer Karte.

## Columns

id
UUID

card_id
UUID

image_type

FRONT

BACK

THUMBNAIL

FULL

url
TEXT

width
INTEGER

height
INTEGER

created_at
TIMESTAMP

Relationship

card_id → cards.id

---

# TABLE: card_variants

Beschreibung:

Verschiedene Varianten einer Karte.

Beispiele:

- Reverse Holo
- First Edition
- Unlimited
- Promo
- Alternate Art
- Full Art
- Gold
- Rainbow

## Columns

id
UUID

card_id
UUID

name
VARCHAR(100)

description
TEXT

created_at
TIMESTAMP

Relationship

card_id → cards.id

---

# TABLE: grading_companies

Beschreibung:

Bewertungsunternehmen.

## Columns

id
UUID

name
VARCHAR(100)

website
TEXT

logo_url
TEXT

created_at
TIMESTAMP

Beispiele

PSA

BGS

CGC

ACE

---

# TABLE: graded_cards

Beschreibung:

Bewertete Karten.

## Columns

id
UUID

card_id
UUID

grading_company_id
UUID

grade
DECIMAL(3,1)

certificate_number
VARCHAR(100)

population
INTEGER

created_at
TIMESTAMP

Relationships

card_id → cards.id

grading_company_id → grading_companies.id

---

# TABLE: card_market_prices

Beschreibung:

Historische Marktpreise.

## Columns

id
UUID

card_id
UUID

price_chf
DECIMAL(12,2)

price_eur
DECIMAL(12,2)

source
VARCHAR(100)

captured_at
TIMESTAMP

Relationship

card_id → cards.id

Indexes

card_id

captured_at

---

# TABLE: card_price_history

Beschreibung:

Historische Preisentwicklung.

## Columns

id
UUID

card_id
UUID

date

DATE

average_price

DECIMAL(12,2)

lowest_price

DECIMAL(12,2)

highest_price

DECIMAL(12,2)

sales_count

INTEGER

created_at
TIMESTAMP