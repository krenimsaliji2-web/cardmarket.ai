-- AlterTable
ALTER TABLE "listing_image" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: exakt ein Hauptbild pro bestehendem Listing mit Bildern, gewählt
-- als das Bild mit der kleinsten sortOrder (Tie-Break: älteste createdAt, dann id) –
-- erhält das bisherige implizite Verhalten ("erstes Bild = Hauptbild").
WITH first_image AS (
  SELECT DISTINCT ON ("listingId") id
  FROM "listing_image"
  ORDER BY "listingId", "sortOrder" ASC, "createdAt" ASC, "id" ASC
)
UPDATE "listing_image"
SET "isPrimary" = true
WHERE id IN (SELECT id FROM first_image);
