import { prisma } from "@/lib/prisma";

/**
 * Liefert die aktuelle Follower-Anzahl eines SellerProfile – live über
 * count() berechnet (keine denormalisierte Zähler-Spalte, siehe
 * Schema-Kommentar bei SellerProfile), damit es nur eine Quelle der
 * Wahrheit gibt.
 */
export async function getFollowerCount(sellerProfileId: string): Promise<number> {
  return prisma.sellerFollow.count({ where: { sellerProfileId } });
}
