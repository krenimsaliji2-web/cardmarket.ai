import { prisma } from "@/lib/prisma";
import { MAX_IMAGES } from "@/lib/validation/listingImages";
import type { StorageProvider } from "@/services/storage/StorageProvider";

import { ListingNotFoundError } from "./errors";

/** Wird geworfen, wenn ein Upload/eine Reihenfolge das Limit von MAX_IMAGES überschreiten würde. */
export class TooManyImagesError extends Error {
  constructor() {
    super(`Ein Listing darf maximal ${MAX_IMAGES} Bilder haben.`);
    this.name = "TooManyImagesError";
  }
}

/** Wird geworfen, wenn ein referenziertes Bild nicht (mehr) zu diesem Listing gehört. */
export class ListingImageNotFoundError extends Error {
  constructor() {
    super("Bild nicht gefunden oder keine Berechtigung.");
    this.name = "ListingImageNotFoundError";
  }
}

/** Lädt ein Listing samt Bildern, scoped auf den Besitzer – zentrale Ownership-Prüfung für alle Funktionen dieser Datei. */
async function getOwnedListingWithImages(listingId: string, sellerId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, sellerId },
    include: { images: true },
  });

  if (!listing) {
    throw new ListingNotFoundError();
  }

  return listing;
}

function sortBySortOrder<T extends { sortOrder: number }>(images: T[]): T[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Liefert alle Bilder eines Listings in Anzeigereihenfolge (Ownership-geprüft). */
export async function getListingImages(listingId: string, sellerId: string) {
  const listing = await getOwnedListingWithImages(listingId, sellerId);
  return sortBySortOrder(listing.images);
}

/**
 * Lädt weitere Bilder zu einem bestehenden Listing hoch ("Nachträglicher
 * Upload") – unabhängig vom übrigen Bearbeiten-Formular. Neue Bilder werden
 * ans Ende der bestehenden Reihenfolge angehängt. Hatte das Listing zuvor
 * noch kein Hauptbild (z. B. weil es bislang gar keine Bilder besaß), wird
 * das erste neu hochgeladene Bild automatisch zum Hauptbild.
 */
export async function addListingImages(
  listingId: string,
  sellerId: string,
  files: File[],
  storageProvider: StorageProvider,
) {
  const listing = await getOwnedListingWithImages(listingId, sellerId);

  if (listing.images.length + files.length > MAX_IMAGES) {
    throw new TooManyImagesError();
  }

  const storedImages = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return storageProvider.save({
        filename: file.name,
        contentType: file.type,
        buffer,
      });
    }),
  );

  const maxSortOrder = listing.images.reduce((max, image) => Math.max(max, image.sortOrder), -1);
  const hasPrimary = listing.images.some((image) => image.isPrimary);

  await prisma.listingImage.createMany({
    data: storedImages.map((stored, index) => ({
      listingId,
      url: stored.url,
      sortOrder: maxSortOrder + 1 + index,
      isPrimary: !hasPrimary && index === 0,
    })),
  });

  return getListingImages(listingId, sellerId);
}

/**
 * Löscht ein einzelnes Bild eines Listings. War es das Hauptbild, wird
 * automatisch das Bild mit der nächstniedrigeren sortOrder zum neuen
 * Hauptbild ("es existiert immer höchstens/genau ein Hauptbild, solange
 * Bilder vorhanden sind"). DB-Änderung zuerst (atomar), danach erst die
 * physische Datei entfernen – analog zu deleteListing.ts/updateListing.ts.
 */
export async function deleteListingImage(
  listingId: string,
  sellerId: string,
  imageId: string,
  storageProvider: StorageProvider,
) {
  const listing = await getOwnedListingWithImages(listingId, sellerId);
  const image = listing.images.find((candidate) => candidate.id === imageId);

  if (!image) {
    throw new ListingImageNotFoundError();
  }

  const nextPrimary = image.isPrimary
    ? sortBySortOrder(listing.images.filter((candidate) => candidate.id !== imageId))[0]
    : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.listingImage.delete({ where: { id: imageId } });

    if (nextPrimary) {
      await tx.listingImage.update({
        where: { id: nextPrimary.id },
        data: { isPrimary: true },
      });
    }
  });

  await storageProvider.delete(image.url);

  return getListingImages(listingId, sellerId);
}

/** Markiert ein bestehendes Bild als Hauptbild – unabhängig von seiner Position in der Reihenfolge. */
export async function setPrimaryListingImage(listingId: string, sellerId: string, imageId: string) {
  const listing = await getOwnedListingWithImages(listingId, sellerId);
  const image = listing.images.find((candidate) => candidate.id === imageId);

  if (!image) {
    throw new ListingImageNotFoundError();
  }

  if (!image.isPrimary) {
    await prisma.$transaction([
      prisma.listingImage.updateMany({
        where: { listingId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  return getListingImages(listingId, sellerId);
}

/**
 * Setzt die Anzeigereihenfolge aller Bilder eines Listings neu.
 * `orderedImageIds` muss exakt die Menge der bestehenden Bild-IDs enthalten
 * (keine fremden/fehlenden IDs) – andernfalls wird nichts geändert.
 */
export async function reorderListingImages(
  listingId: string,
  sellerId: string,
  orderedImageIds: string[],
) {
  const listing = await getOwnedListingWithImages(listingId, sellerId);

  const existingIds = new Set(listing.images.map((image) => image.id));
  const providedIds = new Set(orderedImageIds);

  const isExactMatch =
    existingIds.size === providedIds.size &&
    [...existingIds].every((id) => providedIds.has(id));

  if (!isExactMatch) {
    throw new ListingImageNotFoundError();
  }

  await prisma.$transaction(
    orderedImageIds.map((id, index) =>
      prisma.listingImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return getListingImages(listingId, sellerId);
}
