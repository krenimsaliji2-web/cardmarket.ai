import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/prisma/client";

const PAGE_SIZE = 24;

export type MarketplaceSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "alphabetical"
  | "popular";

export type MarketplaceSellerType = "commercial" | "private";

export interface SearchMarketplaceParams {
  /** Allgemeine Volltextsuche über Kartenname, Kartennummer, Set, Spiel, Edition und Verkäufer. */
  search?: string;
  /** Teiltreffer ausschließlich auf Card.name. */
  cardName?: string;
  /** Teiltreffer ausschließlich auf Card.cardNumber. */
  cardNumber?: string;
  /** Game.slug */
  game?: string;
  /** Set.code */
  set?: string;
  language?: string;
  condition?: string;
  foil?: boolean;
  /** Exakter Treffer auf Listing.edition. */
  edition?: string;
  firstEdition?: boolean;
  /** Exakter Treffer auf Listing.grading. */
  grading?: string;
  /** Teiltreffer auf SellerProfile.displayName. */
  seller?: string;
  verified?: boolean;
  /** "commercial" = SellerProfile.companyName gesetzt, "private" = nicht gesetzt. */
  sellerType?: MarketplaceSellerType;
  /** Dezimal-String, z. B. "20.00" – kein number, wegen Floating-Point-Risiko bei Geldbeträgen. */
  minPrice?: string;
  maxPrice?: string;
  /** Nur Listings mit quantity > 0. */
  available?: boolean;
  /** Default true – nur aktive Listings anzeigen. */
  activeOnly?: boolean;
  sort?: MarketplaceSort;
  page?: number;
}

export interface MarketplaceListingResult {
  id: string;
  price: string;
  language: string;
  condition: string;
  isFoil: boolean;
  edition: string | null;
  isFirstEdition: boolean;
  grading: string | null;
  quantity: number;
  isActive: boolean;
  /** Feature 77 – Favoriten: Grundlage für den Wunschlisten-Variantenschlüssel (cardId+language+condition+foil). */
  cardId: string;
  cardName: string;
  cardNumber: string;
  setName: string;
  gameName: string;
  sellerName: string;
  sellerVerified: boolean;
  /** Feature 77 – Favoriten: für "Besitzer können eigene Listings nicht favorisieren" (Vergleich mit der Session). */
  sellerUserId: string;
  image: string | null;
}

export interface MarketplaceFilterOptions {
  games: { slug: string; name: string }[];
  /**
   * `id` (nicht `code`) ist der eindeutige Bezeichner für die Set-Auswahl:
   * `Set.code` ist nur PRO SPIEL eindeutig (`@@unique([gameId, code])`,
   * siehe schema.prisma). Mit mehreren Spielen im Katalog können
   * unterschiedliche Spiele denselben Code verwenden (z. B. teilen sich
   * Yu-Gi-Oh!s "OTS Tournament Pack 1" und One Pieces "Romance Dawn"
   * zufällig den Code "OP01") – über `code` gefiltert würde das fälschlich
   * beide gleichzeitig treffen.
   */
  sets: { id: string; code: string; name: string; gameSlug: string }[];
  editions: string[];
  gradings: string[];
}

export interface SearchMarketplaceResult {
  listings: MarketplaceListingResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filterOptions: MarketplaceFilterOptions;
}

/** Validiert einen Preis-Parameter aus der URL; ungültige Werte werden ignoriert statt einen Fehler zu werfen. */
function parsePriceParam(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return /^\d+(\.\d{1,2})?$/.test(trimmed) ? trimmed : undefined;
}

function buildOrderBy(sort: MarketplaceSort | undefined): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "alphabetical":
      return { card: { name: "asc" } };
    // "Beliebteste" – Anzahl bisheriger Bestellungen dieses Listings
    // (OrderItem.listingId), absteigend. Keine zusätzliche Query nötig:
    // Prisma zählt die Relation direkt im ORDER BY der Haupt-Query.
    case "popular":
      return { orderItems: { _count: "desc" } };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

function buildWhere(params: SearchMarketplaceParams): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {};

  if (params.activeOnly ?? true) {
    where.isActive = true;
  }

  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { card: { name: { contains: search } } },
      { card: { cardNumber: { contains: search } } },
      { card: { set: { name: { contains: search } } } },
      { card: { game: { name: { contains: search } } } },
      { edition: { contains: search } },
      { seller: { displayName: { contains: search } } },
    ];
  }

  // cardName/cardNumber/game/set betreffen alle die card-Relation – müssen
  // in dasselbe card-Objekt gemergt werden, sonst würde ein Spread den
  // vorherigen überschreiben.
  const cardFilter: Prisma.CardWhereInput = {};
  const cardName = params.cardName?.trim();
  if (cardName) {
    cardFilter.name = { contains: cardName };
  }
  const cardNumber = params.cardNumber?.trim();
  if (cardNumber) {
    cardFilter.cardNumber = { contains: cardNumber };
  }
  if (params.game) {
    cardFilter.game = { slug: params.game };
  }
  if (params.set) {
    // Set.id statt Set.code: code ist nur pro Spiel eindeutig (siehe
    // MarketplaceFilterOptions.sets-Kommentar), id ist es global.
    cardFilter.set = { id: params.set };
  }
  if (Object.keys(cardFilter).length > 0) {
    where.card = cardFilter;
  }

  if (params.language) {
    where.language = params.language;
  }
  if (params.condition) {
    where.condition = params.condition;
  }
  if (params.foil !== undefined) {
    where.isFoil = params.foil;
  }
  if (params.edition) {
    where.edition = params.edition;
  }
  if (params.firstEdition !== undefined) {
    where.isFirstEdition = params.firstEdition;
  }
  if (params.grading) {
    where.grading = params.grading;
  }
  if (params.available) {
    where.quantity = { gt: 0 };
  }

  // seller-Textfilter, verified- und sellerType-Filter betreffen alle die
  // seller-Relation – gleiches Merge-Prinzip wie beim card-Filter.
  const sellerFilter: Prisma.SellerProfileWhereInput = {};
  const sellerName = params.seller?.trim();
  if (sellerName) {
    sellerFilter.displayName = { contains: sellerName };
  }
  if (params.verified) {
    sellerFilter.verified = true;
  }
  if (params.sellerType === "commercial") {
    sellerFilter.companyName = { not: null };
  } else if (params.sellerType === "private") {
    // Ohne Firmennamen gilt ein Seller als privat – sowohl NULL (nie
    // gesetzt) als auch "" (gesetzt, dann geleert) zählen als "kein Firmenname".
    sellerFilter.OR = [{ companyName: null }, { companyName: "" }];
  }
  if (Object.keys(sellerFilter).length > 0) {
    where.seller = sellerFilter;
  }

  const minPrice = parsePriceParam(params.minPrice);
  const maxPrice = parsePriceParam(params.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  return where;
}

async function getFilterOptions(): Promise<MarketplaceFilterOptions> {
  const [games, sets, editions, gradings] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.set.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, game: { select: { slug: true } } },
    }),
    prisma.listing.findMany({
      where: { isActive: true, edition: { not: null } },
      distinct: ["edition"],
      orderBy: { edition: "asc" },
      select: { edition: true },
    }),
    prisma.listing.findMany({
      where: { isActive: true, grading: { not: null } },
      distinct: ["grading"],
      orderBy: { grading: "asc" },
      select: { grading: true },
    }),
  ]);

  return {
    games,
    sets: sets.map((set) => ({
      id: set.id,
      code: set.code,
      name: set.name,
      gameSlug: set.game.slug,
    })),
    editions: editions.map((listing) => listing.edition!),
    gradings: gradings.map((listing) => listing.grading!),
  };
}

/**
 * Alleinige Zugriffsstelle für die erweiterte Marketplace-Suche inkl.
 * Filtern, Sortieren und Pagination. Alle Filter sind optional und frei
 * kombinierbar, Text-Filter sind case-insensitive Teiltreffer (Prisma
 * `contains` – MariaDB-Umstellung: kein `mode: "insensitive"` mehr nötig,
 * das übernimmt bereits die Standard-Kollation `utf8mb4_unicode_ci` der
 * Spalten) – keine In-Memory-Filterung, jede Bedingung landet direkt im
 * Prisma-`where`.
 *
 * Performance: genau ein Promise.all mit count()/findMany()/Filter-
 * Optionen – keine Schleifen, keine Zusatz-Query pro Listing (kein N+1).
 * Der "Beliebteste"-Sort zählt die orderItems-Relation direkt im ORDER BY
 * der Haupt-Query (kein separates COUNT pro Zeile).
 */
export async function searchMarketplace(
  params: SearchMarketplaceParams,
): Promise<SearchMarketplaceResult> {
  const page = Math.max(1, params.page ?? 1);
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [totalCount, listings, filterOptions] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        price: true,
        language: true,
        condition: true,
        isFoil: true,
        edition: true,
        isFirstEdition: true,
        grading: true,
        quantity: true,
        isActive: true,
        card: {
          select: {
            id: true,
            name: true,
            cardNumber: true,
            set: { select: { name: true } },
            game: { select: { name: true } },
          },
        },
        seller: { select: { userId: true, displayName: true, verified: true } },
        images: {
          // Hauptbild zuerst (falls gesetzt), sonst Fallback auf sortOrder – siehe ListingImage.isPrimary.
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    getFilterOptions(),
  ]);

  return {
    listings: listings.map((listing) => ({
      id: listing.id,
      price: listing.price.toString(),
      language: listing.language,
      condition: listing.condition,
      isFoil: listing.isFoil,
      edition: listing.edition,
      isFirstEdition: listing.isFirstEdition,
      grading: listing.grading,
      quantity: listing.quantity,
      isActive: listing.isActive,
      cardId: listing.card.id,
      cardName: listing.card.name,
      cardNumber: listing.card.cardNumber,
      setName: listing.card.set.name,
      gameName: listing.card.game.name,
      sellerName: listing.seller.displayName,
      sellerVerified: listing.seller.verified,
      sellerUserId: listing.seller.userId,
      image: listing.images[0]?.url ?? null,
    })),
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    filterOptions,
  };
}
