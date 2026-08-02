import { Prisma } from "@/prisma/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateSellerProfileInput {
  userId: string;
  displayName: string;
  country: string;
  bio?: string;
}

export type CreateSellerProfileResult =
  | { status: "created" }
  | { status: "already_exists" };

/**
 * Legt ein SellerProfile für einen User an. Ein User darf höchstens ein
 * SellerProfile besitzen (SellerProfile.userId ist unique) – wird bereits
 * eines gefunden oder verstößt der Insert gegen den Unique-Constraint
 * (Race Condition bei parallelen Anfragen), wird "already_exists"
 * zurückgegeben statt ein zweites Profil zu erzeugen oder einen Fehler zu werfen.
 */
export async function createSellerProfile(
  input: CreateSellerProfileInput,
): Promise<CreateSellerProfileResult> {
  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (existing) {
    return { status: "already_exists" };
  }

  try {
    await prisma.sellerProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        country: input.country,
        bio: input.bio ?? null,
        verified: false,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "already_exists" };
    }
    throw error;
  }

  return { status: "created" };
}
