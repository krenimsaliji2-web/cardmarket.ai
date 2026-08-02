import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

export interface CreateConversationInput {
  /** User.id des Käufers – aus der Server-Session, nie vom Client. */
  buyerId: string;
  /** SellerProfile.id des Verkäufers (nicht dessen User.id). */
  sellerId: string;
  /** Listing-Kontext beim allerersten Anlegen; rein informativ, wird bei Wiederverwendung nicht überschrieben. */
  listingId?: string;
}

export type CreateConversationResult =
  | { status: "created"; id: string }
  | { status: "existing"; id: string }
  | { status: "self" };

/**
 * Erstellt einen Chat zwischen Käufer und Verkäufer – oder gibt den
 * bereits bestehenden zurück (ein Chat ist pro (buyerId, sellerId)-Paar
 * eindeutig, siehe Schema-Kommentar). Race-Condition-sicher nach
 * demselben Muster wie services/seller/createSellerProfile.ts: zuerst
 * prüfen, bei parallelem Insert-Konflikt (P2002) den inzwischen
 * angelegten Datensatz erneut laden statt einen Fehler zu werfen.
 *
 * `status: "self"`, falls der Käufer versucht, mit sich selbst zu
 * chatten (eigenes SellerProfile) – serverseitige Absicherung zusätzlich
 * zum UI-seitigen Ausblenden des Buttons auf eigenen Listings/Profilen.
 */
export async function createConversation(
  input: CreateConversationInput,
): Promise<CreateConversationResult> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: input.sellerId },
    select: { userId: true },
  });

  if (seller?.userId === input.buyerId) {
    return { status: "self" };
  }

  const existing = await prisma.conversation.findUnique({
    where: { buyerId_sellerId: { buyerId: input.buyerId, sellerId: input.sellerId } },
    select: { id: true },
  });

  if (existing) {
    return { status: "existing", id: existing.id };
  }

  try {
    const created = await prisma.conversation.create({
      data: {
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        listingId: input.listingId ?? null,
      },
      select: { id: true },
    });
    return { status: "created", id: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingAfterRace = await prisma.conversation.findUnique({
        where: { buyerId_sellerId: { buyerId: input.buyerId, sellerId: input.sellerId } },
        select: { id: true },
      });
      if (existingAfterRace) {
        return { status: "existing", id: existingAfterRace.id };
      }
    }
    throw error;
  }
}
