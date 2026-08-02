import { prisma } from "@/lib/prisma";

export interface SellerReviewResult {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  buyerName: string;
}

/**
 * Lädt alle Bewertungen eines Verkäufers, neueste zuerst. `limit`
 * begrenzt optional die Anzahl (z. B. für "Neueste Bewertungen"-Ausschnitte
 * auf Dashboard/Profil), ohne Limit werden alle geladen.
 */
export async function getSellerReviews(
  sellerId: string,
  limit?: number,
): Promise<SellerReviewResult[]> {
  const reviews = await prisma.review.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      buyer: { select: { name: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    buyerName: review.buyer.name,
  }));
}
