import { cache } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FAVORITE_CONDITION } from "@/lib/validation/wishlistItem";
import { calculateMarketPrice, type MarketPriceWindow } from "@/services/prices/calculateMarketPrice";
import { getPriceChartData } from "@/services/prices/getPriceChartData";
import { getWishlistItemByVariant } from "@/services/wishlist/getWishlistItemByVariant";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { FavoriteButton } from "../../my-wishlist/favorite-button";
import { PriceChart, type MarketPriceWindowData } from "./price-chart";

interface CardPageProps {
  params: Promise<{ id: string }>;
}

const getCard = cache(async (id: string) => {
  return prisma.card.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      cardNumber: true,
      rarity: true,
      language: true,
      image: true,
      artist: true,
      cardType: true,
      hp: true,
      evolvesFrom: true,
      description: true,
      game: { select: { name: true, slug: true } },
      set: { select: { name: true, code: true, releaseDate: true } },
    },
  });
});

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return { title: "Karte nicht gefunden – Project Atlas" };
  }

  return { title: `${card.name} – Project Atlas` };
}

/** Date -> ISO-String für die Übergabe an die Client-Komponente (RSC-Props). */
function serializeWindow(window: MarketPriceWindow): MarketPriceWindowData {
  return { ...window, lastSaleAt: window.lastSaleAt ? window.lastSaleAt.toISOString() : null };
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const favoriteVariant = {
    cardId: card.id,
    language: card.language,
    condition: DEFAULT_FAVORITE_CONDITION,
    foil: false,
  };

  // Marktpreis-Statistik, Diagrammdaten und Favoritenstatus unabhängig
  // voneinander, parallel geladen (kein Wasserfall) – nutzen ausschließlich
  // bestehende, bereits N+1-freie Services (Feature 30/39/77), keine neue
  // Preis-/Favoriten-Logik.
  const [marketPrice, chartData, favoriteItem] = await Promise.all([
    calculateMarketPrice(card.id),
    getPriceChartData(card.id),
    session ? getWishlistItemByVariant(session.user.id, favoriteVariant) : Promise.resolve(null),
  ]);

  const priceChartRanges = {
    "7d": { stats: serializeWindow(marketPrice.last7Days), points: chartData.last7Days },
    "30d": { stats: serializeWindow(marketPrice.last30Days), points: chartData.last30Days },
    "90d": { stats: serializeWindow(marketPrice.last90Days), points: chartData.last90Days },
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid grid-cols-1 gap-10 md:grid-cols-[320px_1fr]">
        <div className="mx-auto w-full max-w-xs md:mx-0">
          <div className="aspect-5/7 overflow-hidden rounded-lg border bg-muted">
            {card.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import, siehe services/import/.
              <img
                src={card.image}
                alt={card.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-10" />
                <span className="text-sm">Kein Bild</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <Link href={`/games/${card.game.slug}`} className="hover:underline">
                {card.game.name}
              </Link>
              {" · "}
              <Link href={`/sets/${card.set.code}`} className="hover:underline">
                {card.set.name}
              </Link>
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{card.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">
              #{card.cardNumber}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{card.rarity}</Badge>
            <Badge variant="secondary">{card.cardType}</Badge>
            {card.hp !== null && <Badge variant="secondary">{card.hp} HP</Badge>}
          </div>

          <p className="text-sm text-muted-foreground">
            Illustration: <span className="text-foreground">{card.artist}</span>
          </p>

          {card.description && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {card.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/cards/${card.id}/listings`}>Verfügbare Angebote</Link>
            </Button>
            <FavoriteButton
              cardId={favoriteVariant.cardId}
              language={favoriteVariant.language}
              condition={favoriteVariant.condition}
              foil={favoriteVariant.foil}
              initialFavorited={favoriteItem !== null}
              requiresLogin={!session}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Details</h2>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  Sprache
                </dt>
                <dd className="mt-1 font-medium">{card.language}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  Set-Code
                </dt>
                <dd className="mt-1 font-mono font-medium">{card.set.code}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  Release-Datum
                </dt>
                <dd className="mt-1 font-medium">
                  {formatDate(card.set.releaseDate)}
                </dd>
              </div>
              {card.evolvesFrom && (
                <div>
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    Evolves From
                  </dt>
                  <dd className="mt-1 font-medium">{card.evolvesFrom}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <PriceChart ranges={priceChartRanges} currency="chf" />
      </section>
    </main>
  );
}
