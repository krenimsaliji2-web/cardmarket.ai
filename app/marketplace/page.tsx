import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { searchMarketplace, type MarketplaceSellerType, type MarketplaceSort } from "@/services/marketplace/searchMarketplace";
import { buildWishlistVariantKey, getWishlistVariantKeys } from "@/services/wishlist/getWishlistVariantKeys";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/marketplace/listing-card";

import { MarketplaceFilters } from "./marketplace-filters";

interface MarketplacePageProps {
  searchParams: Promise<{
    search?: string;
    cardName?: string;
    cardNumber?: string;
    page?: string;
    game?: string;
    set?: string;
    language?: string;
    condition?: string;
    foil?: string;
    edition?: string;
    firstEdition?: string;
    grading?: string;
    seller?: string;
    verified?: string;
    sellerType?: string;
    minPrice?: string;
    maxPrice?: string;
    available?: string;
    activeOnly?: string;
    sort?: string;
  }>;
}

const VALID_SORTS: MarketplaceSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "alphabetical",
  "popular",
];
const VALID_SELLER_TYPES: MarketplaceSellerType[] = ["commercial", "private"];

// Nur strukturierte, indexierungswürdige Facetten landen im Canonical –
// Freitext- (search/cardName/cardNumber/seller), Paginierungs- und
// Sortier-Parameter erzeugen sonst unzählige Near-Duplicate-URLs für
// Suchmaschinen ("Filterseiten weiterhin indexierbar, Canonical beachten").
const CANONICAL_PARAM_KEYS = [
  "game",
  "set",
  "language",
  "condition",
  "foil",
  "edition",
  "firstEdition",
  "grading",
  "sellerType",
  "verified",
  "available",
] as const;

function parseSort(value: string | undefined): MarketplaceSort {
  return VALID_SORTS.includes(value as MarketplaceSort) ? (value as MarketplaceSort) : "newest";
}

function parseSellerType(value: string | undefined): MarketplaceSellerType | undefined {
  return VALID_SELLER_TYPES.includes(value as MarketplaceSellerType)
    ? (value as MarketplaceSellerType)
    : undefined;
}

function buildPageHref(current: URLSearchParams, page: number): string {
  const params = new URLSearchParams(current);
  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
  const qs = params.toString();
  return `/marketplace${qs ? `?${qs}` : ""}`;
}

/** Seitenzahlen um die aktuelle Seite herum (max. 5), inkl. Erste/Letzte – kein Bruch mit bestehenden Prev/Next-Links. */
function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous !== 0 && p - previous > 1) {
      result.push("ellipsis");
    }
    result.push(p);
    previous = p;
  }
  return result;
}

export async function generateMetadata({ searchParams }: MarketplacePageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;

  const canonicalParams = new URLSearchParams();
  for (const key of CANONICAL_PARAM_KEYS) {
    const value = resolvedParams[key];
    if (value) {
      canonicalParams.set(key, value);
    }
  }
  canonicalParams.sort();
  const qs = canonicalParams.toString();

  return {
    title: "Marketplace – Project Atlas",
    description: "Alle aktiven Angebote von Project Atlas auf einen Blick.",
    alternates: {
      canonical: `/marketplace${qs ? `?${qs}` : ""}`,
    },
  };
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const resolvedParams = await searchParams;

  const search = resolvedParams.search ?? "";
  const cardName = resolvedParams.cardName ?? "";
  const cardNumber = resolvedParams.cardNumber ?? "";
  const page = Number.parseInt(resolvedParams.page ?? "1", 10) || 1;
  const game = resolvedParams.game ?? "";
  const set = resolvedParams.set ?? "";
  const language = resolvedParams.language ?? "";
  const condition = resolvedParams.condition ?? "";
  const foil = resolvedParams.foil === "true";
  const edition = resolvedParams.edition ?? "";
  const firstEdition = resolvedParams.firstEdition === "true";
  const grading = resolvedParams.grading ?? "";
  const seller = resolvedParams.seller ?? "";
  const verified = resolvedParams.verified === "true";
  const sellerType = parseSellerType(resolvedParams.sellerType);
  const minPrice = resolvedParams.minPrice ?? "";
  const maxPrice = resolvedParams.maxPrice ?? "";
  const available = resolvedParams.available === "true";
  // Default true, sofern nicht explizit auf "false" gesetzt (URL-Parameter fehlt = Standardverhalten).
  const activeOnly = resolvedParams.activeOnly !== "false";
  const sort = parseSort(resolvedParams.sort);

  // Session zuerst (wird für den Favoriten-Abgleich benötigt), danach
  // Marketplace-Suche und Wunschlisten-Varianten parallel (Feature 77 –
  // Favoriten: "Favoritenstatus laden" ohne N+1 – EINE zusätzliche, leichte
  // Query unabhängig von der Anzahl der Listings auf dieser Seite, siehe
  // getWishlistVariantKeys()). Für nicht eingeloggte Besucher entfällt die
  // zweite Query komplett.
  const session = await auth.api.getSession({ headers: await headers() });

  const [result, favoriteKeys] = await Promise.all([
    searchMarketplace({
      search: search || undefined,
      cardName: cardName || undefined,
      cardNumber: cardNumber || undefined,
      page,
      game: game || undefined,
      set: set || undefined,
      language: language || undefined,
      condition: condition || undefined,
      foil: resolvedParams.foil !== undefined ? foil : undefined,
      edition: edition || undefined,
      firstEdition: resolvedParams.firstEdition !== undefined ? firstEdition : undefined,
      grading: grading || undefined,
      seller: seller || undefined,
      verified: verified || undefined,
      sellerType,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      available: available || undefined,
      activeOnly,
      sort,
    }),
    session ? getWishlistVariantKeys(session.user.id) : Promise.resolve([]),
  ]);

  const favoriteItemIdByKey = new Map(
    favoriteKeys.map((entry) => [
      buildWishlistVariantKey(entry.cardId, entry.language, entry.condition, entry.foil),
      entry.itemId,
    ]),
  );

  // Alle aktiven Filter-/Sortier-Parameter bleiben für Pagination-Links in der URL erhalten.
  const currentParams = new URLSearchParams();
  if (search) currentParams.set("search", search);
  if (cardName) currentParams.set("cardName", cardName);
  if (cardNumber) currentParams.set("cardNumber", cardNumber);
  if (game) currentParams.set("game", game);
  if (set) currentParams.set("set", set);
  if (language) currentParams.set("language", language);
  if (condition) currentParams.set("condition", condition);
  if (resolvedParams.foil !== undefined) currentParams.set("foil", String(foil));
  if (edition) currentParams.set("edition", edition);
  if (resolvedParams.firstEdition !== undefined) currentParams.set("firstEdition", String(firstEdition));
  if (grading) currentParams.set("grading", grading);
  if (seller) currentParams.set("seller", seller);
  if (verified) currentParams.set("verified", "true");
  if (sellerType) currentParams.set("sellerType", sellerType);
  if (minPrice) currentParams.set("minPrice", minPrice);
  if (maxPrice) currentParams.set("maxPrice", maxPrice);
  if (available) currentParams.set("available", "true");
  if (!activeOnly) currentParams.set("activeOnly", "false");
  if (sort !== "newest") currentParams.set("sort", sort);

  const pageNumbers = buildPageNumbers(page, result.totalPages);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-[280px_1fr] md:items-start">
        <MarketplaceFilters
          filterOptions={result.filterOptions}
          initial={{
            search,
            cardName,
            cardNumber,
            game,
            set,
            language,
            condition,
            foil: resolvedParams.foil !== undefined ? foil : false,
            edition,
            firstEdition: resolvedParams.firstEdition !== undefined ? firstEdition : false,
            grading,
            seller,
            verified,
            sellerType,
            minPrice,
            maxPrice,
            available,
            activeOnly,
            sort,
          }}
        />

        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            {result.totalCount} {result.totalCount === 1 ? "Angebot" : "Angebote"} gefunden
          </p>

          <section>
            {result.listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Angebote gefunden.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.listings.map((listing) => {
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

          {result.totalPages > 1 && (
            <nav
              aria-label="Seitennavigation"
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageHref(currentParams, page - 1)}>Zurück</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Zurück
                </Button>
              )}

              {pageNumbers.map((entry, index) =>
                entry === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={entry}
                    asChild={entry !== page}
                    variant={entry === page ? "default" : "outline"}
                    size="sm"
                    disabled={entry === page}
                  >
                    {entry === page ? (
                      <span aria-current="page">{entry}</span>
                    ) : (
                      <Link href={buildPageHref(currentParams, entry)}>{entry}</Link>
                    )}
                  </Button>
                ),
              )}

              {page < result.totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildPageHref(currentParams, page + 1)}>Weiter</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Weiter
                </Button>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
