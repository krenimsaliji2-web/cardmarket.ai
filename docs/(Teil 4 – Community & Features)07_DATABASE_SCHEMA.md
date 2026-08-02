---

# TABLE: conversations

Beschreibung:

Private Unterhaltungen zwischen Benutzern.

## Columns

id
UUID
PRIMARY KEY

type

DIRECT

GROUP

created_by
UUID

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

created_by → users.id

---

# TABLE: conversation_participants

id
UUID

conversation_id
UUID

user_id
UUID

last_read_at
TIMESTAMP

joined_at
TIMESTAMP

Relationships

conversation_id → conversations.id

user_id → users.id

UNIQUE

(conversation_id, user_id)

---

# TABLE: messages

Beschreibung:

Nachrichten innerhalb einer Unterhaltung.

## Columns

id
UUID

conversation_id
UUID

sender_id
UUID

message
TEXT

attachment_url
TEXT NULL

message_type

TEXT

IMAGE

FILE

SYSTEM

is_edited
BOOLEAN

created_at
TIMESTAMP

edited_at
TIMESTAMP NULL

Relationships

conversation_id → conversations.id

sender_id → users.id

---

# TABLE: notifications

Beschreibung:

Benachrichtigungen.

## Columns

id
UUID

user_id
UUID

type
VARCHAR(100)

title
VARCHAR(255)

message
TEXT

url
TEXT

is_read
BOOLEAN

created_at
TIMESTAMP

Relationship

user_id → users.id

---

# TABLE: wishlists

Beschreibung:

Wunschlisten.

## Columns

id
UUID

user_id
UUID

name
VARCHAR(255)

is_public
BOOLEAN

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationship

user_id → users.id

---

# TABLE: wishlist_items

id
UUID

wishlist_id
UUID

card_id
UUID

target_price
DECIMAL(12,2)

created_at
TIMESTAMP

Relationships

wishlist_id → wishlists.id

card_id → cards.id

---

# TABLE: collections

Beschreibung:

Kartensammlung eines Benutzers.

## Columns

id
UUID

user_id
UUID

name
VARCHAR(255)

description
TEXT

is_public
BOOLEAN

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationship

user_id → users.id

---

# TABLE: collection_items

id
UUID

collection_id
UUID

card_id
UUID

quantity
INTEGER

condition
VARCHAR(50)

language
VARCHAR(50)

is_graded
BOOLEAN

estimated_value
DECIMAL(12,2)

created_at
TIMESTAMP

Relationships

collection_id → collections.id

card_id → cards.id

---

# TABLE: portfolios

Beschreibung:

Portfolio eines Benutzers.

## Columns

id
UUID

user_id
UUID

total_value
DECIMAL(12,2)

daily_change
DECIMAL(12,2)

weekly_change
DECIMAL(12,2)

monthly_change
DECIMAL(12,2)

updated_at
TIMESTAMP

Relationship

user_id → users.id

---

# TABLE: portfolio_entries

id
UUID

portfolio_id
UUID

card_id
UUID

quantity
INTEGER

average_buy_price
DECIMAL(12,2)

current_value
DECIMAL(12,2)

profit_loss
DECIMAL(12,2)

updated_at
TIMESTAMP

Relationships

portfolio_id → portfolios.id

card_id → cards.id

---

# TABLE: reviews

Beschreibung:

Bewertungen nach einem Kauf.

## Columns

id
UUID

order_id
UUID

reviewer_id
UUID

reviewed_user_id
UUID

rating
INTEGER

comment
TEXT

created_at
TIMESTAMP

Relationships

order_id → orders.id

reviewer_id → users.id

reviewed_user_id → users.id

---

# TABLE: reports

Beschreibung:

Gemeldete Inhalte.

## Columns

id
UUID

reported_by
UUID

target_type
VARCHAR(50)

target_id
UUID

reason
TEXT

status

OPEN

IN_REVIEW

RESOLVED

REJECTED

created_at
TIMESTAMP

Relationships

reported_by → users.id

---

# TABLE: admin_logs

Beschreibung:

Alle Administratoraktionen.

## Columns

id
UUID

admin_id
UUID

action
VARCHAR(255)

target_type
VARCHAR(100)

target_id
UUID

details
JSONB

created_at
TIMESTAMP

Relationship

admin_id → users.id

---

# TABLE: ai_results

Beschreibung:

Ergebnisse der KI.

## Columns

id
UUID

user_id
UUID

image_url
TEXT

recognized_card_id
UUID NULL

confidence
DECIMAL(5,2)

condition_estimate
VARCHAR(50)

estimated_price
DECIMAL(12,2)

ocr_text
TEXT

created_at
TIMESTAMP

Relationships

user_id → users.id

recognized_card_id → cards.id

---