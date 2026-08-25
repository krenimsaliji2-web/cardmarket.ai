import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Search } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchMarketplace } from "@/services/marketplace/searchMarketplace";
import { buildWishlistVariantKey, getWishlistVariantKeys } from "@/services/wishlist/getWishlistVariantKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/marketplace/listing-card";

// Zeigt immer den aktuellen Datenbankstand (Set-/Kartenanzahl, Angebote), kein
// statischer Build-Snapshot.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project Atlas – Der Trading-Card-Marktplatz",
  description:
    "Entdecke Pokémon, Yu-Gi-Oh!, Magic: The Gathering, One Piece Card Game und Disney Lorcana an einem Ort.",
};

const FEATURED_COUNT = 8;

async function getGames() {
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      _count: { select: { sets: true, cards: true } },
    },
  });
}

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [games, featured, favoriteKeys] = await Promise.all([
    getGames(),
    // Neueste aktive Angebote zuerst – zeigt auf der Startseite reale
    // Marktplatz-Inhalte statt nur die (oft noch leere) Spieleübersicht.
    // Nutzt dieselbe, bereits bestehende Suche wie /marketplace (keine
    // neue Businesslogik), begrenzt hier nur auf die ersten Treffer.
    searchMarketplace({ sort: "newest", activeOnly: true }),
    session ? getWishlistVariantKeys(session.user.id) : Promise.resolve([]),
  ]);

  const featuredListings = featured.listings.slice(0, FEATURED_COUNT);
  const favoriteItemIdByKey = new Map(
    favoriteKeys.map((entry) => [
      buildWishlistVariantKey(entry.cardId, entry.language, entry.condition, entry.foil),
      entry.itemId,
    ]),
  );

  const totalCards = games.reduce((sum, g) => sum + g._count.cards, 0);
  const totalSets = games.reduce((sum, g) => sum + g._count.sets, 0);

  return (
    <main className="flex flex-col">
      {/* Full-bleed Hero mit Markenfarben-Verlauf – bewusst der einzige Ort
          auf der Seite mit Farbeinsatz jenseits der neutralen Graupalette
          (siehe styles/globals.css, --brand). */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in oklch, var(--brand) 18%, transparent), transparent), var(--background)",
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-muted px-3 py-1 text-xs font-medium text-brand">
            Pokémon · Yu-Gi-Oh! · Magic · One Piece · Lorcana
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Der Marktplatz für{" "}
              <span className="bg-gradient-to-r from-brand to-foreground bg-clip-text text-transparent">
                Trading Cards
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-balance text-muted-foreground sm:text-lg">
              Kaufe und verkaufe Karten aus fünf Sammelkartenspielen an einem Ort –
              transparente Preise, verifizierte Verkäufer, echter Preisverlauf.
            </p>
          </div>

          {/* Reines HTML-GET-Formular statt Client-Komponente: navigiert
              direkt zu /marketplace?search=..., liest dieselben searchParams
              wie die bestehende Marketplace-Suche (keine neue Suchlogik). */}
          <form action="/marketplace" className="relative w-full max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Karten, Sets oder Spiele durchsuchen…"
              className="h-14 rounded-full pl-12 text-base shadow-lg"
              aria-label="Marktplatz durchsuchen"
            />
          </form>

          <dl className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 pt-4 text-sm">
            <div>
              <dt className="sr-only">Karten im Katalog</dt>
              <dd>
                <span className="font-bold tabular-nums">{totalCards.toLocaleString("de-CH")}</span>{" "}
                <span className="text-muted-foreground">Karten</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Sets im Katalog</dt>
              <dd>
                <span className="font-bold tabular-nums">{totalSets.toLocaleString("de-CH")}</span>{" "}
                <span className="text-muted-foreground">Sets</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Aktive Angebote</dt>
              <dd>
                <span className="font-bold tabular-nums">{featured.totalCount.toLocaleString("de-CH")}</span>{" "}
                <span className="text-muted-foreground">aktive Angebote</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Neueste Angebote
            </h2>
            <Link href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Alle Angebote ansehen →
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine aktiven Angebote – sobald Verkäufer Karten einstellen, erscheinen sie hier.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => {
                const isOwnListing = session?.user.id === listing.sellerUserId;
                const favoriteKey = buildWishlistVariantKey(
                  listing.cardId,
                  listing.language,
                  listing.condition,
                  listing.isFoil,
                );
                return (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorited={favoriteItemIdByKey.has(favoriteKey)}
                    requiresLogin={!session}
                    isOwnListing={isOwnListing}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Unterstützte Spiele
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {games.map((game) => {
              const hasCards = game._count.cards > 0;

              return (
              <Link key={game.id} href={`/games/${game.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {game.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Logo-URLs kommen aus externen Import-Quellen (siehe services/import/).
                        <img
                          src={game.logo}
                          alt={`${game.name} Logo`}
                          className="size-9 shrink-0 object-contain"
                        />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                          {game.name.charAt(0)}
                        </div>
                      )}
                      <CardTitle className="text-base">{game.name}</CardTitle>
                    </div>
                    <CardDescription className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="secondary">
                        {game._count.sets} {game._count.sets === 1 ? "Set" : "Sets"}
                      </Badge>
                      {hasCards ? (
                        <Badge variant="secondary">{game._count.cards} Karten</Badge>
                      ) : (
                        <Badge variant="outline">Bald verfügbar</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Selbst verkaufen?
        </h2>
        <p className="max-w-md text-balance text-muted-foreground">
          Erstelle ein Verkäuferprofil und stelle deine ersten Karten in wenigen Minuten ein.
        </p>
        <Button asChild size="lg">
          <Link href="/seller/new">Jetzt Verkäufer werden</Link>
        </Button>
      </section>
      </div>
    </main>
  );
}
