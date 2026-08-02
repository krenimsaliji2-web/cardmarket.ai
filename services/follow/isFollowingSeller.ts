import { prisma } from "@/lib/prisma";

/** Liefert, ob `followerId` diesem SellerProfile aktuell folgt. */
export async function isFollowingSeller(
  followerId: string,
  sellerProfileId: string,
): Promise<boolean> {
  const existing = await prisma.sellerFollow.findUnique({
    where: { followerId_sellerProfileId: { followerId, sellerProfileId } },
    select: { id: true },
  });

  return existing !== null;
}
