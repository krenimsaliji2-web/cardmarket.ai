import { prisma } from "@/lib/prisma";

export type UnfollowSellerResult = { status: "unfollowed" } | { status: "not_following" };

/**
 * Beendet das Folgen. `deleteMany()` statt `delete()` – idempotent, kein
 * Fehler (P2025), falls der Follow-Eintrag gar nicht (mehr) existiert;
 * das Ergebnis unterscheidet die beiden Fälle trotzdem über `result.count`.
 */
export async function unfollowSeller(
  followerId: string,
  sellerProfileId: string,
): Promise<UnfollowSellerResult> {
  const result = await prisma.sellerFollow.deleteMany({
    where: { followerId, sellerProfileId },
  });

  return result.count > 0 ? { status: "unfollowed" } : { status: "not_following" };
}
