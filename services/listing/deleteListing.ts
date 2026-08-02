import { prisma } from "@/lib/prisma";
import type { StorageProvider } from "@/services/storage/StorageProvider";

import { ListingNotFoundError } from "./errors";

/**
 * Löscht ein Listing. Die ListingImage-Zeilen werden durch die
 * Datenbank-Cascade (onDelete: Cascade, siehe prisma/schema.prisma)
 * automatisch mitgelöscht. Die eigentlichen Bilddateien kennt die
 * Datenbank aber nicht – die werden danach explizit über den injizierten
 * StorageProvider entfernt.
 */
export async function deleteListing(
  listingId: string,
  sellerId: string,
  storageProvider: StorageProvider,
) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, sellerId },
    include: { images: true },
  });

  if (!listing) {
    throw new ListingNotFoundError();
  }

  await prisma.listing.delete({ where: { id: listing.id } });

  await Promise.all(listing.images.map((image) => storageProvider.delete(image.url)));

  return { deletedImageCount: listing.images.length };
}
