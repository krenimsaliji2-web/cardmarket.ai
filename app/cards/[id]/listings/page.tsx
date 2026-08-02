import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CardListingsPageProps {
  params: Promise<{ id: string }>;
}

const getCard = cache(async (id: string) => {
  return prisma.card.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      cardNumber: true,
      image: true,
      game: { select: { name: true } },
      set: { select: { name: true } },
    },
  });
});

const getActiveListings = cache(async (cardId: string) => {
  return prisma.listing.findMany({
    where: { cardId, isActive: true },
    orderBy: [{ price: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      price: true,
      quantity: true,
      language: true,
      condition: true,
      description: true,
      seller: { select: { displayName: true, verified: true } },
      images: {
        // Hauptbild zuerst (falls gesetzt), sonst Fallback auf sortOrder – siehe ListingImage.isPrimary.
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: CardListingsPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return { title: "Karte nicht gefunden – Project Atlas" };
  }

  return { title: `Angebote für ${card.name} – Project Atlas` };
}

export default async function CardListingsPage({ params }: CardListingsPageProps) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    notFound();
  }

  const listings = await getActiveListings(id);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-start gap-4 sm:flex-row">
        <div className="aspect-5/7 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import, siehe services/import/.
            <img
              src={card.image}
              alt={card.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {card.game.name} · {card.set.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{card.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">
            #{card.cardNumber}
          </p>
          <Badge variant="secondary">
            {listings.length}{" "}
            {listings.length === 1 ? "aktives Angebot" : "aktive Angebote"}
          </Badge>
        </div>
      </section>

      <section>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Für diese Karte gibt es aktuell keine Angebote.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="flex flex-col overflow-hidden py-0">
                <div className="flex aspect-5/7 items-center justify-center bg-muted">
                  {listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                    <img
                      src={listing.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-8 text-muted-foreground" />
                  )}
                </div>

                <CardContent className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {listing.seller.displayName}
                    </p>
                    <Badge variant={listing.seller.verified ? "default" : "outline"}>
                      {listing.seller.verified ? "Verifiziert" : "Nicht verifiziert"}
                    </Badge>
                  </div>

                  <p className="text-2xl font-bold tracking-tight">
                    {formatPrice(listing.price.toString())}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{listing.language}</Badge>
                    <Badge variant="secondary">{listing.condition}</Badge>
                    <Badge variant="secondary">Menge: {listing.quantity}</Badge>
                  </div>

                  {listing.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {listing.description}
                    </p>
                  )}

                  <Button asChild className="mt-auto w-full">
                    <Link href={`/listings/${listing.id}`}>Angebot ansehen</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
