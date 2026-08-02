import { prisma } from "@/lib/prisma";

import { ListingNotFoundError } from "./errors";

export interface UpdateListingInput {
  listingId: string;
  /** Zur erneuten Berechtigungsprüfung – Aktualisierung nur, wenn das Listing diesem Seller gehört. */
  sellerId: string;
  price: string;
  quantity: number;
  language: string;
  condition: string;
  isFoil: boolean;
  isSigned: boolean;
  description?: string;
  edition?: string;
  isFirstEdition: boolean;
  grading?: string;
}

// Re-export für bestehende Importe (@/services/listing/updateListing).
export { ListingNotFoundError };

/**
 * Aktualisiert die Stammdaten eines Listings (Preis, Menge, Sprache, Zustand
 * etc.). Bilder werden hier bewusst NICHT mehr angefasst – seit Feature 71
 * laufen Upload/Löschen/Hauptbild/Reihenfolge ausschließlich über die
 * eigenständigen, sofort wirksamen Aktionen in
 * services/listing/images.ts (app/seller/listings/[id]/image-actions.ts),
 * nicht mehr gebündelt über dieses Formular – ein Bild-Update wartet daher
 * nicht mehr auf den "Speichern"-Klick der übrigen Felder.
 */
export async function updateListing(input: UpdateListingInput) {
  const existing = await prisma.listing.findFirst({
    where: { id: input.listingId, sellerId: input.sellerId },
    select: { id: true },
  });

  if (!existing) {
    throw new ListingNotFoundError();
  }

  return prisma.listing.update({
    where: { id: input.listingId },
    data: {
      price: input.price,
      quantity: input.quantity,
      language: input.language,
      condition: input.condition,
      isFoil: input.isFoil,
      isSigned: input.isSigned,
      description: input.description ?? null,
      edition: input.edition ?? null,
      isFirstEdition: input.isFirstEdition,
      grading: input.grading ?? null,
    },
  });
}
