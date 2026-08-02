import { cache } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { AddToCartButton } from "./add-to-cart-button";
import { ListingGallery } from "./listing-gallery";
import { MessageSellerButton } from "./message-seller-button";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

// Nur aktive Listings sind öffentlich erreichbar; inaktive und nicht
// existierende liefern beide notFound() (kein Unterschied nach außen).
const getListing = cache(async (id: string) => {
  return prisma.listing.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      price: true,
      quantity: true,
      language: true,
      condition: true,
      description: true,
      createdAt: true,
      sellerId: true,
      card: {
        select: {
          id: true,
          name: true,
          cardNumber: true,
          image: true,
          set: { select: { name: true } },
          game: { select: { name: true } },
        },
      },
      images: {
        // Hauptbild zuerst (falls gesetzt), sonst Fallback auf sortOrder – siehe ListingImage.isPrimary.
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, url: true },
      },
      seller: {
        select: { userId: true, displayName: true, verified: true },
      },
    },
  });
});

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return { title: "Listing nicht gefunden – Project Atlas" };
  }

  return { title: `${listing.card.name} – Project Atlas` };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const isOwnListing = session?.user.id === listing.seller.userId;

  const galleryImages =
    listing.images.length > 0
      ? listing.images
      : listing.card.image
        ? [{ id: "card-image", url: listing.card.image }]
        : [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <ListingGallery images={galleryImages} alt={listing.card.name} />

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {listing.card.game.name} · {listing.card.set.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              <Link href={`/cards/${listing.card.id}`} className="hover:underline">
                {listing.card.name}
              </Link>
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              #{listing.card.cardNumber}
            </p>
          </div>

          <p className="text-4xl font-bold tracking-tight">
            {formatPrice(listing.price.toString())}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{listing.language}</Badge>
            <Badge variant="secondary">{listing.condition}</Badge>
            <Badge variant="secondary">Menge: {listing.quantity}</Badge>
          </div>

          <AddToCartButton listingId={listing.id} disabled={isOwnListing} />
          <MessageSellerButton listingId={listing.id} disabled={isOwnListing} />

          {listing.description && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          )}

          <Card>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  <Link href={`/seller/${listing.sellerId}`} className="hover:underline">
                    {listing.seller.displayName}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Eingestellt am {formatDate(listing.createdAt)}
                </p>
              </div>
              <Badge variant={listing.seller.verified ? "default" : "outline"}>
                {listing.seller.verified ? "Verifiziert" : "Nicht verifiziert"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
