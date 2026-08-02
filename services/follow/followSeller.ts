import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export type FollowSellerResult =
  | { status: "followed" }
  | { status: "already_following" }
  | { status: "self" }
  | { status: "seller_not_found" };

/**
 * Lässt einen User einem SellerProfile folgen. `followerId` kommt
 * ausschließlich aus der Server-Session (nie vom Client, siehe
 * app/seller/[id]/actions.ts). Verhindert Selbst-Folgen (Vergleich mit
 * dem User hinter dem SellerProfile) und doppelte Einträge – race-
 * condition-sicher nach demselben Muster wie
 * services/messages/createConversation.ts: erst prüfen, bei parallelem
 * Insert-Konflikt (P2002 auf den Unique-Index) den Konflikt als
 * "already_following" behandeln statt einen Fehler zu werfen.
 */
export async function followSeller(
  followerId: string,
  sellerProfileId: string,
): Promise<FollowSellerResult> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: { userId: true },
  });

  if (!seller) {
    return { status: "seller_not_found" };
  }

  if (seller.userId === followerId) {
    return { status: "self" };
  }

  const existing = await prisma.sellerFollow.findUnique({
    where: { followerId_sellerProfileId: { followerId, sellerProfileId } },
    select: { id: true },
  });

  if (existing) {
    return { status: "already_following" };
  }

  try {
    await prisma.sellerFollow.create({ data: { followerId, sellerProfileId } });
    return { status: "followed" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "already_following" };
    }
    throw error;
  }
}
