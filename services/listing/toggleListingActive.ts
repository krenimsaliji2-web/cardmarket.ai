import { prisma } from "@/lib/prisma";

import { ListingNotFoundError } from "./errors";

/** Schaltet isActive um. Wirft ListingNotFoundError, wenn das Listing nicht existiert oder nicht diesem Seller gehört. */
export async function toggleListingActive(listingId: string, sellerId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, sellerId },
    select: { id: true, isActive: true },
  });

  if (!listing) {
    throw new ListingNotFoundError();
  }

  return prisma.listing.update({
    where: { id: listing.id },
    data: { isActive: !listing.isActive },
  });
}

/**
 * Admin-Variante (Feature 78 – Moderation): identische Kernoperation wie
 * toggleListingActive() (Listing deaktivieren/reaktivieren), aber bewusst
 * OHNE Ownership-Filter – ein Admin muss jedes Listing moderieren können,
 * nicht nur eigene (Admins besitzen ohnehin kein SellerProfile). Die
 * Ownership-Prüfung der Seller-Variante bleibt für /seller unverändert
 * bestehen; das ist hier keine zweite, konkurrierende Businesslogik,
 * sondern derselbe Toggle über einen für Admins passenden Zugriffspfad.
 */
export async function toggleListingActiveAsAdmin(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, isActive: true },
  });

  if (!listing) {
    throw new ListingNotFoundError();
  }

  return prisma.listing.update({
    where: { id: listing.id },
    data: { isActive: !listing.isActive },
  });
}
