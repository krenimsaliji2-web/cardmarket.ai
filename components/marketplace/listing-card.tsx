import Link from "next/link";
import { ImageOff } from "lucide-react";

import type { MarketplaceListingResult } from "@/services/marketplace/searchMarketplace";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { FavoriteButton } from "@/app/my-wishlist/favorite-button";

interface ListingCardProps {
  listing: MarketplaceListingResult;
  isFavorited: boolean;
  requiresLogin: boolean;
  isOwnListing: boolean;
}

/**
 * Ein einzelnes Marketplace-Angebot als Karte – aus app/marketplace/page.tsx
 * herausgelöst (Feature: Startseite zeigt jetzt ebenfalls echte Angebote,
 * siehe app/page.tsx), damit beide Seiten exakt dieselbe Darstellung nutzen
 * statt eines zweiten, abweichenden Markups.
 */
export function ListingCard({ listing, isFavorited, requiresLogin, isOwnListing }: ListingCardProps) {
  return (
    <Card className="group flex flex-col overflow-hidden py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex aspect-5/7 items-center justify-center bg-muted">
        {listing.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
          <img
            src={listing.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageOff className="size-8 text-muted-foreground" />
        )}
        <FavoriteButton
          variant="overlay"
          cardId={listing.cardId}
          language={listing.language}
          condition={listing.condition}
          foil={listing.isFoil}
          initialFavorited={isFavorited}
          requiresLogin={requiresLogin}
          disabled={isOwnListing}
        />
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <p className="truncate text-sm font-medium">{listing.cardName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {listing.gameName} · {listing.setName} · #{listing.cardNumber}
        </p>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{listing.sellerName}</p>
          {listing.sellerVerified && <Badge>Verifiziert</Badge>}
        </div>

        <p className="text-xl font-bold tracking-tight">{formatPrice(listing.price)}</p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{listing.language}</Badge>
          <Badge variant="secondary">{listing.condition}</Badge>
          {listing.isFoil && <Badge variant="secondary">Foil</Badge>}
          {listing.isFirstEdition && <Badge variant="secondary">1st Edition</Badge>}
          {listing.edition && <Badge variant="secondary">{listing.edition}</Badge>}
          {listing.grading && <Badge variant="secondary">{listing.grading}</Badge>}
          {!listing.isActive && <Badge variant="outline">Inaktiv</Badge>}
          {listing.quantity <= 0 ? (
            <Badge variant="outline">Nicht verfügbar</Badge>
          ) : (
            <Badge variant="secondary">Menge: {listing.quantity}</Badge>
          )}
        </div>

        <Button asChild className="mt-auto w-full">
          <Link href={`/listings/${listing.id}`}>Angebot ansehen</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
