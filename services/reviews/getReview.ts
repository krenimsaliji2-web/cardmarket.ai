import { prisma } from "@/lib/prisma";

export interface ReviewResult {
  id: string;
  rating: number;
  comment: string | null;
}

/**
 * Lädt die bestehende Bewertung eines Käufers für eine bestimmte
 * Bestellung/Verkäufer-Kombination (oder `null`, falls noch keine
 * existiert) – damit das Bewertungsformular vorausgefüllt werden kann.
 */
export async function getReview(
  orderId: string,
  sellerId: string,
  buyerId: string,
): Promise<ReviewResult | null> {
  return prisma.review.findUnique({
    where: { orderId_sellerId_buyerId: { orderId, sellerId, buyerId } },
    select: { id: true, rating: true, comment: true },
  });
}
