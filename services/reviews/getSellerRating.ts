import { prisma } from "@/lib/prisma";

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SellerRatingResult {
  averageRating: number | null;
  totalReviews: number;
  distribution: RatingDistribution;
}

/**
 * Berechnet Durchschnittsbewertung, Gesamtanzahl und Sterneverteilung eines
 * Verkäufers live aus den bestehenden Review-Zeilen (aggregate/groupBy) –
 * es wird nichts dauerhaft gespeichert oder zwischengespeichert.
 */
export async function getSellerRating(sellerId: string): Promise<SellerRatingResult> {
  const [aggregate, grouped] = await Promise.all([
    prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { sellerId },
      _count: { _all: true },
    }),
  ]);

  const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const group of grouped) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    distribution[rating] = group._count._all;
  }

  return {
    averageRating: aggregate._avg.rating,
    totalReviews: aggregate._count._all,
    distribution,
  };
}
