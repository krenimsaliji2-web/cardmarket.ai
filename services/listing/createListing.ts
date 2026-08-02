import { prisma } from "@/lib/prisma";
import type { StorageProvider } from "@/services/storage/StorageProvider";

export interface CreateListingInput {
  sellerId: string;
  cardId: string;
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
  /** In gewünschter Anzeigereihenfolge; das erste Bild wird das Hauptbild (sortOrder 0). */
  images: File[];
}

/**
 * Erstellt ein aktives Listing samt Bildern, in genau dieser Reihenfolge:
 * 1. Listing anlegen
 * 2. Bilder über den injizierten StorageProvider speichern
 * 3. ListingImage-Datensätze (mit sortOrder) anlegen
 *
 * Der StorageProvider wird als Parameter injiziert (Dependency Injection) –
 * diese Funktion kennt nur das StorageProvider-Interface, nie eine konkrete
 * Implementierung wie LocalStorageProvider.
 */
export async function createListing(
  input: CreateListingInput,
  storageProvider: StorageProvider,
) {
  const listing = await prisma.listing.create({
    data: {
      sellerId: input.sellerId,
      cardId: input.cardId,
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
      isActive: true,
    },
  });

  const storedImages = await Promise.all(
    input.images.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return storageProvider.save({
        filename: file.name,
        contentType: file.type,
        buffer,
      });
    }),
  );

  await prisma.listingImage.createMany({
    data: storedImages.map((stored, index) => ({
      listingId: listing.id,
      url: stored.url,
      sortOrder: index,
      isPrimary: index === 0,
    })),
  });

  return listing;
}
