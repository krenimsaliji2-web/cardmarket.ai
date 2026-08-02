import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@/prisma/generated/prisma/client";

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalListings: number;
  activeListings: number;
  inactiveListings: number;
  totalOrders: number;
  totalRevenue: string;
  totalCardsSold: number;
  totalReviews: number;
  averageRating: number | null;
  totalCollections: number;
  totalWishlists: number;
  totalNotifications: number;
  totalPriceHistoryEntries: number;
  totalImportedCards: number;
  totalImportedSets: number;
}

export interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AdminRecentOrder {
  id: string;
  buyerName: string;
  buyerEmail: string;
  totalPrice: string;
  currency: string;
  status: string;
  createdAt: Date;
}

export interface AdminRecentReview {
  id: string;
  sellerName: string;
  rating: number;
  createdAt: Date;
}

export interface AdminTopSeller {
  sellerId: string;
  sellerName: string;
  revenue: string;
}

export interface AdminTopCard {
  cardId: string;
  cardName: string;
  unitsSold: number;
}

export interface AdminDashboardResult {
  stats: AdminDashboardStats;
  recentUsers: AdminRecentUser[];
  recentOrders: AdminRecentOrder[];
  recentReviews: AdminRecentReview[];
  topSellers: AdminTopSeller[];
  topCards: AdminTopCard[];
}

const RECENT_LIMIT = 10;
const TOP_LIMIT = 10;

/**
 * Lädt die vollständigen Admin-Dashboard-Daten. Gibt `null` zurück, wenn
 * der User nicht existiert oder `role !== ADMIN` ist – die Route zeigt in
 * diesem Fall notFound() (kein Redirect, keine Informationspreisgabe,
 * siehe app/admin/page.tsx). Reiner Read: kein Feature/keine Tabelle wird
 * hier verändert.
 *
 * Performance: ein einziges Promise.all mit count()/aggregate()/groupBy()
 * für alle Kennzahlen (keine Schleifen, keine Einzel-Queries pro Zeile).
 * "Top Karten nach Verkäufen" ist die einzige Ausnahme – OrderItem hat
 * kein direktes cardId-Feld (siehe Feature 29), daher wird hier (wie schon
 * in calculateSellerAnalytics.ts, Feature 44) einmal über alle OrderItems
 * mit Listing→Card-Join gelesen und in JS nach cardId gruppiert, statt per
 * groupBy() auf listingId zu gruppieren (das würde dieselbe Karte über
 * mehrere Listings hinweg fälschlich als mehrere Karten zählen).
 * "Top Verkäufer nach Umsatz" hat dieses Problem nicht (sellerId ist ein
 * direktes OrderItem-Feld) und nutzt daher echtes DB-seitiges groupBy().
 */
export async function getDashboard(userId: string): Promise<AdminDashboardResult | null> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== Role.ADMIN) {
    return null;
  }

  const [
    totalUsers,
    totalSellers,
    totalListings,
    activeListings,
    inactiveListings,
    totalOrders,
    revenueAgg,
    cardsSoldAgg,
    totalReviews,
    ratingAgg,
    totalCollections,
    totalWishlists,
    totalNotifications,
    totalPriceHistoryEntries,
    totalImportedCards,
    totalImportedSets,
    recentUsersRaw,
    recentOrdersRaw,
    recentReviewsRaw,
    topSellersRaw,
    allOrderItemsForTopCards,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { isActive: false } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true } }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.collection.count(),
    prisma.wishlist.count(),
    prisma.notification.count(),
    prisma.priceHistory.count(),
    prisma.card.count(),
    prisma.set.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        rating: true,
        createdAt: true,
        seller: { select: { displayName: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["sellerId"],
      _sum: { subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: TOP_LIMIT,
    }),
    prisma.orderItem.findMany({
      select: {
        quantity: true,
        listing: { select: { cardId: true, card: { select: { name: true } } } },
      },
    }),
  ]);

  const sellerIds = topSellersRaw.map((entry) => entry.sellerId);
  const sellerProfiles = await prisma.sellerProfile.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, displayName: true },
  });
  const sellerNameById = new Map(sellerProfiles.map((seller) => [seller.id, seller.displayName]));

  const cardStats = new Map<string, { cardName: string; unitsSold: number }>();
  for (const item of allOrderItemsForTopCards) {
    const cardId = item.listing.cardId;
    const entry = cardStats.get(cardId) ?? { cardName: item.listing.card.name, unitsSold: 0 };
    entry.unitsSold += item.quantity;
    cardStats.set(cardId, entry);
  }
  const topCards: AdminTopCard[] = [...cardStats.entries()]
    .sort((a, b) => b[1].unitsSold - a[1].unitsSold)
    .slice(0, TOP_LIMIT)
    .map(([cardId, entry]) => ({ cardId, cardName: entry.cardName, unitsSold: entry.unitsSold }));

  return {
    stats: {
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      inactiveListings,
      totalOrders,
      totalRevenue: (revenueAgg._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      totalCardsSold: cardsSoldAgg._sum.quantity ?? 0,
      totalReviews,
      averageRating: ratingAgg._avg.rating,
      totalCollections,
      totalWishlists,
      totalNotifications,
      totalPriceHistoryEntries,
      totalImportedCards,
      totalImportedSets,
    },
    recentUsers: recentUsersRaw,
    recentOrders: recentOrdersRaw.map((order) => ({
      id: order.id,
      buyerName: order.user.name,
      buyerEmail: order.user.email,
      totalPrice: order.totalPrice.toFixed(2),
      currency: order.currency,
      // Order existiert im Schema erst nach erfolgreicher Zahlung (siehe
      // createOrder.ts) – kein eigenes status-Feld (bewusste Entscheidung
      // seit Feature 29/34), daher fester Wert, analog zu getOrders.ts.
      status: "Bezahlt",
      createdAt: order.createdAt,
    })),
    recentReviews: recentReviewsRaw.map((review) => ({
      id: review.id,
      sellerName: review.seller.displayName,
      rating: review.rating,
      createdAt: review.createdAt,
    })),
    topSellers: topSellersRaw.map((entry) => ({
      sellerId: entry.sellerId,
      sellerName: sellerNameById.get(entry.sellerId) ?? "Unbekannt",
      revenue: (entry._sum.subtotal ?? new Prisma.Decimal(0)).toFixed(2),
    })),
    topCards,
  };
}
