---

# TABLE: inventory

Beschreibung:

Persönlicher Kartenbestand eines Verkäufers.

## Columns

id
UUID
PRIMARY KEY

user_id
UUID

card_id
UUID

quantity
INTEGER

condition
VARCHAR(50)

language
VARCHAR(50)

is_foil
BOOLEAN

purchase_price
DECIMAL(12,2)

purchase_date
DATE

storage_location
VARCHAR(100)

notes
TEXT

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

user_id → users.id

card_id → cards.id

Indexes

user_id

card_id

---

# TABLE: listings

Beschreibung:

Öffentliche Verkaufsinserate.

## Columns

id
UUID

seller_id
UUID

inventory_id
UUID

title
VARCHAR(255)

description
TEXT

listing_type

FIXED_PRICE

AUCTION

price
DECIMAL(12,2)

currency
VARCHAR(3)

quantity
INTEGER

condition
VARCHAR(50)

language
VARCHAR(50)

is_negotiable
BOOLEAN

status

DRAFT

ACTIVE

SOLD

ENDED

PAUSED

DELETED

views
INTEGER

favorites
INTEGER

published_at
TIMESTAMP

expires_at
TIMESTAMP

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

seller_id → users.id

inventory_id → inventory.id

Indexes

seller_id

status

price

listing_type

---

# TABLE: listing_images

id
UUID

listing_id
UUID

url
TEXT

sort_order
INTEGER

created_at
TIMESTAMP

Relationship

listing_id → listings.id

---

# TABLE: listing_views

id
UUID

listing_id
UUID

user_id
UUID NULL

ip_address
INET

viewed_at
TIMESTAMP

Relationship

listing_id → listings.id

---

# TABLE: listing_favorites

id
UUID

listing_id
UUID

user_id
UUID

created_at
TIMESTAMP

Relationship

listing_id → listings.id

user_id → users.id

UNIQUE

(user_id, listing_id)

---

# TABLE: offers

Beschreibung:

Preisvorschläge.

## Columns

id
UUID

listing_id
UUID

buyer_id
UUID

offered_price
DECIMAL(12,2)

message
TEXT

status

PENDING

ACCEPTED

DECLINED

EXPIRED

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

listing_id → listings.id

buyer_id → users.id

---

# TABLE: auctions

id
UUID

listing_id
UUID

starting_price
DECIMAL(12,2)

reserve_price
DECIMAL(12,2)

buy_now_price
DECIMAL(12,2)

minimum_increment
DECIMAL(12,2)

starts_at
TIMESTAMP

ends_at
TIMESTAMP

winner_id
UUID NULL

status

SCHEDULED

RUNNING

ENDED

CANCELLED

Relationships

listing_id → listings.id

winner_id → users.id

---

# TABLE: bids

id
UUID

auction_id
UUID

user_id
UUID

amount
DECIMAL(12,2)

is_auto_bid
BOOLEAN

created_at
TIMESTAMP

Relationships

auction_id → auctions.id

user_id → users.id

Indexes

auction_id

user_id

amount

---

# TABLE: orders

Beschreibung:

Abgeschlossene Käufe.

## Columns

id
UUID

buyer_id
UUID

seller_id
UUID

order_number
VARCHAR(50)

subtotal
DECIMAL(12,2)

shipping_cost
DECIMAL(12,2)

fees
DECIMAL(12,2)

total
DECIMAL(12,2)

status

PENDING

PAID

SHIPPED

DELIVERED

CANCELLED

REFUNDED

created_at
TIMESTAMP

updated_at
TIMESTAMP

Relationships

buyer_id → users.id

seller_id → users.id

Indexes

buyer_id

seller_id

status

order_number

---

# TABLE: order_items

id
UUID

order_id
UUID

listing_id
UUID

quantity
INTEGER

unit_price
DECIMAL(12,2)

total_price
DECIMAL(12,2)

Relationships

order_id → orders.id

listing_id → listings.id

---

# TABLE: payments

id
UUID

order_id
UUID

provider
VARCHAR(50)

provider_payment_id
VARCHAR(255)

amount
DECIMAL(12,2)

currency
VARCHAR(3)

platform_fee
DECIMAL(12,2)

seller_amount
DECIMAL(12,2)

status

PENDING

AUTHORIZED

PAID

FAILED

REFUNDED

created_at
TIMESTAMP

Relationships

order_id → orders.id

---

# TABLE: payouts

id
UUID

seller_id
UUID

amount
DECIMAL(12,2)

currency
VARCHAR(3)

status

PENDING

PROCESSING

COMPLETED

FAILED

provider_reference
VARCHAR(255)

created_at
TIMESTAMP

Relationships

seller_id → users.id

---

# TABLE: shipments

id
UUID

order_id
UUID

carrier
VARCHAR(100)

tracking_number
VARCHAR(255)

tracking_url
TEXT

status

PREPARING

SHIPPED

IN_TRANSIT

DELIVERED

RETURNED

shipped_at
TIMESTAMP

delivered_at
TIMESTAMP

Relationships

order_id → orders.id