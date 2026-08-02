import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getSellerRating } from "@/services/reviews/getSellerRating";
import { getSellerReviews, type SellerReviewResult } from "@/services/reviews/getSellerReviews";

export interface SellerDashboardListing {
  id: string;
  cardName: string;
  gameName: string;
  setName: string;
  price: string;
  quantity: number;
  language: string;
  condition: string;
  isActive: boolean;
  image: string | null;
}

export interface RecentSale {
  id: string;
  createdAt: Date;
  cardName: string;
  cardImage: string | null;
  buyerId: string;
  quantity: number;
  price: string;
  subtotal: string;
}

export interface TopListingEntry {
  listingId: string;
  cardName: string;
  cardImage: string | null;
  isActive: boolean;
  revenue: string;
  unitsSold: number;
}

export interface SellerDashboardStats {
  totalRevenue: string;
  /** Feature 76 – Umsatz des heutigen Kalendertags. */
  revenueToday: string;
  /** Feature 76 – rollierendes 7-Tage-Fenster (nicht die Kalenderwoche, siehe calculateSellerAnalytics.ts's revenueThisWeek). */
  revenueLast7Days: string;
  totalSales: number;
  salesToday: number;
  salesThisMonth: number;
  averageOrderValue: string;
  /** Feature 76 – Gesamtumsatz ÷ verkaufte Stückzahl (identische Definition wie calculateSellerAnalytics.ts's averageCardPrice). */
  averageSalePrice: string;
  activeListings: number;
  inactiveListings: number;
  /** Feature 76 – Teilmenge von inactiveListings: Bestand durch einen Verkauf auf 0 (siehe services/inventory/updateInventory.ts), nicht manuell deaktiviert. */
  soldOutListings: number;
  totalStock: number;
  averageRating: number | null;
  totalReviews: number;
}

export interface SellerDashboardResult {
  /** SellerProfile.id – verlinkt auf das öffentliche Profil (/seller/[id]). */
  id: string;
  displayName: string;
  verified: boolean;
  stats: SellerDashboardStats;
  listings: SellerDashboardListing[];
  recentSales: RecentSale[];
  /** Feature 76 – eigene Listings (nicht Karten/Sets, siehe services/analytics/), sortiert nach Umsatz. */
  topListings: TopListingEntry[];
  recentReviews: SellerReviewResult[];
}

const RECENT_SALES_LIMIT = 10;
const RECENT_REVIEWS_LIMIT = 5;
const TOP_LISTINGS_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lädt die komplette Datengrundlage für das Verkäufer-Dashboard (/seller).
 * Gibt `null` zurück, wenn der User noch kein SellerProfile besitzt – die
 * Route zeigt in diesem Fall weiterhin die "Verkäufer werden"-Karte statt
 * selbst Prisma abzufragen.
 *
 * "Verkäufe" = einzelne OrderItem-Positionen dieses Verkäufers (nicht
 * Bestellungen, da eine Bestellung mehrere Verkäufer enthalten kann, siehe
 * getSellerOrders.ts). "Durchschnittlicher Bestellwert" ist dagegen pro
 * DISTINCT Order gemittelt (Gesamtumsatz ÷ Anzahl unterschiedlicher
 * Bestellungen, die eine eigene Position enthalten) – die klassische
 * AOV-Definition, nicht der Durchschnitt pro Position.
 *
 * Feature 76 – Seller Dashboard: revenueToday/revenueLast7Days/
 * averageSalePrice/soldOutListings/topListings werden AUSSCHLIESSLICH aus
 * den bereits geladenen `listings`/`orderItems`-Arrays abgeleitet – keine
 * zusätzliche Query, dieselbe eine Promise.all-Ladung wie zuvor.
 */
export async function getSellerDashboard(userId: string): Promise<SellerDashboardResult | null> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true, verified: true },
  });

  if (!sellerProfile) {
    return null;
  }

  const [
    activeListings,
    inactiveListings,
    stockAgg,
    listings,
    orderItems,
    rating,
    recentReviews,
  ] = await Promise.all([
    prisma.listing.count({ where: { sellerId: sellerProfile.id, isActive: true } }),
    prisma.listing.count({ where: { sellerId: sellerProfile.id, isActive: false } }),
    prisma.listing.aggregate({
      where: { sellerId: sellerProfile.id },
      _sum: { quantity: true },
    }),
    prisma.listing.findMany({
      where: { sellerId: sellerProfile.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        price: true,
        quantity: true,
        language: true,
        condition: true,
        isActive: true,
        card: {
          select: { name: true, set: { select: { name: true } }, game: { select: { name: true } } },
        },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: { sellerId: sellerProfile.id },
      orderBy: { order: { createdAt: "desc" } },
      select: {
        id: true,
        orderId: true,
        listingId: true,
        cardName: true,
        cardImage: true,
        quantity: true,
        price: true,
        subtotal: true,
        order: { select: { createdAt: true, userId: true } },
      },
    }),
    getSellerRating(sellerProfile.id),
    getSellerReviews(sellerProfile.id, RECENT_REVIEWS_LIMIT),
  ]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const totalRevenue = orderItems.reduce(
    (sum, item) => sum.plus(item.subtotal),
    new Prisma.Decimal(0),
  );
  const revenueToday = orderItems
    .filter((item) => item.order.createdAt >= startOfToday)
    .reduce((sum, item) => sum.plus(item.subtotal), new Prisma.Decimal(0));
  const revenueLast7Days = orderItems
    .filter((item) => item.order.createdAt >= sevenDaysAgo)
    .reduce((sum, item) => sum.plus(item.subtotal), new Prisma.Decimal(0));

  const salesToday = orderItems.filter((item) => item.order.createdAt >= startOfToday).length;
  const salesThisMonth = orderItems.filter((item) => item.order.createdAt >= startOfMonth).length;

  const revenueByOrder = new Map<string, Prisma.Decimal>();
  let totalUnitsSold = 0;
  for (const item of orderItems) {
    revenueByOrder.set(
      item.orderId,
      (revenueByOrder.get(item.orderId) ?? new Prisma.Decimal(0)).plus(item.subtotal),
    );
    totalUnitsSold += item.quantity;
  }
  const distinctOrderCount = revenueByOrder.size;
  const averageOrderValue =
    distinctOrderCount === 0 ? new Prisma.Decimal(0) : totalRevenue.dividedBy(distinctOrderCount);
  const averageSalePrice =
    totalUnitsSold === 0 ? new Prisma.Decimal(0) : totalRevenue.dividedBy(totalUnitsSold);

  const soldOutListings = listings.filter((listing) => listing.quantity === 0 && !listing.isActive).length;

  const isActiveByListingId = new Map(listings.map((listing) => [listing.id, listing.isActive]));
  const listingStats = new Map<
    string,
    { listingId: string; cardName: string; cardImage: string | null; revenue: Prisma.Decimal; unitsSold: number }
  >();
  for (const item of orderItems) {
    const entry = listingStats.get(item.listingId) ?? {
      listingId: item.listingId,
      cardName: item.cardName,
      cardImage: item.cardImage,
      revenue: new Prisma.Decimal(0),
      unitsSold: 0,
    };
    entry.revenue = entry.revenue.plus(item.subtotal);
    entry.unitsSold += item.quantity;
    listingStats.set(item.listingId, entry);
  }
  const topListings: TopListingEntry[] = [...listingStats.values()]
    .sort((a, b) => b.revenue.comparedTo(a.revenue))
    .slice(0, TOP_LISTINGS_LIMIT)
    .map((entry) => ({
      listingId: entry.listingId,
      cardName: entry.cardName,
      cardImage: entry.cardImage,
      // Listing kann inzwischen gelöscht sein? Nein – onDelete: Restrict auf
      // OrderItem.listing verhindert das (siehe prisma/schema.prisma), daher
      // ist der Eintrag in isActiveByListingId immer vorhanden.
      isActive: isActiveByListingId.get(entry.listingId) ?? false,
      revenue: entry.revenue.toFixed(2),
      unitsSold: entry.unitsSold,
    }));

  return {
    id: sellerProfile.id,
    displayName: sellerProfile.displayName,
    verified: sellerProfile.verified,
    stats: {
      totalRevenue: totalRevenue.toFixed(2),
      revenueToday: revenueToday.toFixed(2),
      revenueLast7Days: revenueLast7Days.toFixed(2),
      totalSales: orderItems.length,
      salesToday,
      salesThisMonth,
      averageOrderValue: averageOrderValue.toFixed(2),
      averageSalePrice: averageSalePrice.toFixed(2),
      activeListings,
      inactiveListings,
      soldOutListings,
      totalStock: stockAgg._sum.quantity ?? 0,
      averageRating: rating.averageRating,
      totalReviews: rating.totalReviews,
    },
    listings: listings.map((listing) => ({
      id: listing.id,
      cardName: listing.card.name,
      gameName: listing.card.game.name,
      setName: listing.card.set.name,
      price: listing.price.toFixed(2),
      quantity: listing.quantity,
      language: listing.language,
      condition: listing.condition,
      isActive: listing.isActive,
      image: listing.images[0]?.url ?? null,
    })),
    recentSales: orderItems.slice(0, RECENT_SALES_LIMIT).map((item) => ({
      id: item.id,
      createdAt: item.order.createdAt,
      cardName: item.cardName,
      cardImage: item.cardImage,
      buyerId: item.order.userId,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
    topListings,
    recentReviews,
  };
}
