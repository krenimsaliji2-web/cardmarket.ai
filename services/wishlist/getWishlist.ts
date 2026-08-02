import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getCurrentMarketPrice } from "@/services/prices/getCurrentMarketPrice";

export interface WishlistItemResult {
  id: string;
  cardId: string;
  cardName: string;
  cardImage: string;
  setName: string;
  language: string;
  condition: string;
  foil: boolean;
  targetPrice: string | null;
  notes: string | null;
  /** Aktueller Marktpreis (getCurrentMarketPrice(), Feature 39); `null`, falls noch keine Verkaufsdaten vorliegen. */
  currentMarketPrice: string | null;
  /** currentMarketPrice − targetPrice; `null`, falls einer der beiden Werte fehlt. */
  priceDifference: string | null;
}

export interface WishlistResult {
  id: string;
  totalCount: number;
  items: WishlistItemResult[];
}

/**
 * Jeder User besitzt genau eine Wishlist – existiert noch keine, wird sie
 * hier lazy angelegt. Wiederverwendet von addToWishlist()/
 * updateWishlistItem()/removeFromWishlist()/getWishlistItemByVariant()/
 * getWishlistVariantKeys(), damit die "genau eine Wishlist pro User"-Regel
 * an genau einer Stelle lebt (gleiches Muster wie
 * services/collection/getCollection.ts). `upsert()` allein ist bei zwei
 * echt gleichzeitigen Aufrufen für denselben (noch nicht existierenden)
 * User NICHT race-safe (Prisma prüft intern erst per SELECT, klassisches
 * TOCTOU) – bei genau dieser Konstellation crashte
 * services/collection/getCollection.ts in Production mit P2002, siehe dort.
 * Hier vorsorglich mit demselben Fix gehärtet (P2002 abfangen, bestehende
 * Zeile erneut laden), gleiches Muster wie createConversation.ts.
 */
export async function getOrCreateWishlist(userId: string): Promise<{ id: string }> {
  try {
    return await prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.wishlist.findUniqueOrThrow({
        where: { userId },
        select: { id: true },
      });
    }
    throw error;
  }
}

/**
 * Lädt die Wishlist eines Users inkl. aller Items, neueste zuerst,
 * angereichert um den aktuellen Marktpreis (ausschließlich über
 * getCurrentMarketPrice() aus Feature 39 – keine eigene Preislogik) und
 * die Differenz zum Zielpreis.
 */
export async function getWishlist(userId: string): Promise<WishlistResult> {
  const wishlist = await getOrCreateWishlist(userId);

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cardId: true,
      language: true,
      condition: true,
      foil: true,
      targetPrice: true,
      notes: true,
      card: { select: { name: true, image: true, set: { select: { name: true } } } },
    },
  });

  const marketPrices = await Promise.all(
    items.map((item) => getCurrentMarketPrice(item.cardId)),
  );

  return {
    id: wishlist.id,
    totalCount: items.length,
    items: items.map((item, index) => {
      const currentMarketPrice = marketPrices[index].currentPrice;
      const targetPrice = item.targetPrice?.toFixed(2) ?? null;
      const priceDifference =
        currentMarketPrice !== null && targetPrice !== null
          ? new Prisma.Decimal(currentMarketPrice).minus(targetPrice).toFixed(2)
          : null;

      return {
        id: item.id,
        cardId: item.cardId,
        cardName: item.card.name,
        cardImage: item.card.image,
        setName: item.card.set.name,
        language: item.language,
        condition: item.condition,
        foil: item.foil,
        targetPrice,
        notes: item.notes,
        currentMarketPrice,
        priceDifference,
      };
    }),
  };
}
