import { prisma } from "@/lib/prisma";

export interface FollowingSellerResult {
  sellerProfileId: string;
  displayName: string;
  avatar: string | null;
  bannerImage: string | null;
  verified: boolean;
  listingCount: number;
  salesCount: number;
  averageRating: number | null;
  followingSince: Date;
}

export interface GetFollowingSellersOptions {
  page?: number;
  pageSize?: number;
}

export interface GetFollowingSellersResult {
  items: FollowingSellerResult[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt die gefolgten Verkäufer eines Users für /my-following, neueste
 * Follow-Beziehung zuerst, echte DB-seitige Pagination (analog zu
 * getNotifications.ts/getReports.ts).
 *
 * Performance: eine findMany() mit Listing-Anzahl über verschachnetes
 * `_count` (kein N+1) + eine count() für die Pagination + zwei
 * `groupBy()` für Verkäufe/Durchschnittsbewertung, GEBÜNDELT über alle
 * Seller dieser Seite hinweg (`sellerId: { in: [...] }`) statt einer
 * Query pro Verkäufer – macht zusammen vier Queries unabhängig von der
 * Anzahl gefolgter Verkäufer, alle unabhängigen über Promise.all.
 */
export async function getFollowingSellers(
  followerId: string,
  options: GetFollowingSellersOptions = {},
): Promise<GetFollowingSellersResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const [follows, total] = await Promise.all([
    prisma.sellerFollow.findMany({
      where: { followerId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        createdAt: true,
        sellerProfile: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            bannerImage: true,
            verified: true,
            _count: { select: { listings: true } },
          },
        },
      },
    }),
    prisma.sellerFollow.count({ where: { followerId } }),
  ]);

  const sellerProfileIds = follows.map((follow) => follow.sellerProfile.id);

  const [salesCounts, ratings] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: sellerProfileIds } },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: sellerProfileIds } },
      _avg: { rating: true },
    }),
  ]);

  const salesCountBySellerId = new Map(salesCounts.map((entry) => [entry.sellerId, entry._count._all]));
  const averageRatingBySellerId = new Map(ratings.map((entry) => [entry.sellerId, entry._avg.rating]));

  return {
    items: follows.map((follow) => ({
      sellerProfileId: follow.sellerProfile.id,
      displayName: follow.sellerProfile.displayName,
      avatar: follow.sellerProfile.avatar,
      bannerImage: follow.sellerProfile.bannerImage,
      verified: follow.sellerProfile.verified,
      listingCount: follow.sellerProfile._count.listings,
      salesCount: salesCountBySellerId.get(follow.sellerProfile.id) ?? 0,
      averageRating: averageRatingBySellerId.get(follow.sellerProfile.id) ?? null,
      followingSince: follow.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}
