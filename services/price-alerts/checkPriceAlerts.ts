import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getOrCreateWishlist } from "@/services/wishlist/getWishlist";
import { getCurrentMarketPrice } from "@/services/prices/getCurrentMarketPrice";

export interface TriggeredAlert {
  cardId: string;
  wishlistItemId: string;
  cardName: string;
  cardImage: string;
  setName: string;
  language: string;
  condition: string;
  foil: boolean;
  currentPrice: string;
  targetPrice: string;
  /** targetPrice − currentPrice (positive = Ersparnis). */
  difference: string;
  /** difference ÷ targetPrice × 100. */
  percentBelowTarget: string;
}

/**
 * Prüft alle WishlistItems mit gesetztem Zielpreis gegen den aktuellen
 * Marktpreis (ausschließlich über getCurrentMarketPrice() aus Feature 39 –
 * keine eigene Preislogik). Regel: marketPrice <= targetPrice => Alarm
 * ausgelöst. Schreibt NICHTS in die Datenbank – alles wird live berechnet,
 * bei jedem Aufruf neu.
 *
 * Fehlt für eine Karte noch jeder Marktpreis (keine Verkaufsdaten), kann
 * kein Vergleich stattfinden – diese Position löst keinen Alarm aus.
 */
export async function checkPriceAlerts(userId: string): Promise<TriggeredAlert[]> {
  const wishlist = await getOrCreateWishlist(userId);

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id, targetPrice: { not: null } },
    select: {
      id: true,
      cardId: true,
      language: true,
      condition: true,
      foil: true,
      targetPrice: true,
      card: { select: { name: true, image: true, set: { select: { name: true } } } },
    },
  });

  if (items.length === 0) {
    return [];
  }

  const marketPrices = await Promise.all(
    items.map((item) => getCurrentMarketPrice(item.cardId)),
  );

  const alerts: TriggeredAlert[] = [];

  items.forEach((item, index) => {
    const currentPriceValue = marketPrices[index].currentPrice;
    const targetPrice = item.targetPrice as Prisma.Decimal;

    if (currentPriceValue === null) {
      return;
    }

    const currentPrice = new Prisma.Decimal(currentPriceValue);

    if (currentPrice.lessThanOrEqualTo(targetPrice)) {
      const difference = targetPrice.minus(currentPrice);
      const percentBelowTarget = targetPrice.isZero()
        ? new Prisma.Decimal(0)
        : difference.dividedBy(targetPrice).times(100);

      alerts.push({
        cardId: item.cardId,
        wishlistItemId: item.id,
        cardName: item.card.name,
        cardImage: item.card.image,
        setName: item.card.set.name,
        language: item.language,
        condition: item.condition,
        foil: item.foil,
        currentPrice: currentPrice.toFixed(2),
        targetPrice: targetPrice.toFixed(2),
        difference: difference.toFixed(2),
        percentBelowTarget: percentBelowTarget.toFixed(2),
      });
    }
  });

  return alerts;
}
