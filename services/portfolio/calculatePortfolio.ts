import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getCurrentMarketPrice } from "@/services/prices/getCurrentMarketPrice";
import { getOrCreateCollection } from "@/services/collection/getCollection";

export interface PortfolioPosition {
  collectionItemId: string;
  cardId: string;
  cardName: string;
  cardImage: string;
  setName: string;
  language: string;
  condition: string;
  foil: boolean;
  quantity: number;
  /** Kaufpreis pro Einheit; `null`, falls beim Sammlungseintrag kein Kaufpreis hinterlegt ist. */
  purchasePricePerUnit: string | null;
  /** Aktueller Marktpreis pro Einheit (getCurrentMarketPrice()); `null`, falls noch keine Verkaufsdaten vorliegen. */
  marketPricePerUnit: string | null;
  /** purchasePricePerUnit × quantity; `null`, wenn kein Kaufpreis bekannt ist. */
  totalPurchasePrice: string | null;
  /** marketPricePerUnit × quantity; "0.00", wenn kein Marktpreis bekannt ist. */
  totalMarketValue: string;
  /** totalMarketValue − totalPurchasePrice; `null`, wenn kein Kaufpreis bekannt ist (nicht berechenbar). */
  profitLoss: string | null;
  /** profitLoss ÷ totalPurchasePrice × 100; `null`, wenn kein Kaufpreis bekannt ist oder dieser 0 ist. */
  profitLossPercent: string | null;
}

export interface PortfolioTopEntry {
  collectionItemId: string;
  cardId: string;
  cardName: string;
  value: string;
}

export interface PortfolioResult {
  totalValue: string;
  totalPurchasePrice: string;
  totalProfit: string;
  totalLoss: string;
  performancePercent: string | null;
  totalCardCount: number;
  uniqueCardCount: number;
  averageCardValue: string;
  /** Position mit dem höchsten Marktpreis PRO EINHEIT (nicht Gesamtwert). */
  mostExpensiveCard: PortfolioTopEntry | null;
  /** Position mit dem höchsten GESAMTWERT (marketPricePerUnit × quantity). */
  mostValuablePosition: PortfolioTopEntry | null;
  positions: PortfolioPosition[];
}

/**
 * Berechnet das Portfolio (Gewinn/Verlust) auf Basis der bestehenden
 * Collection (Feature 40) und Marktpreise (Feature 39). Nutzt
 * ausschließlich getCurrentMarketPrice() für Preise – keine eigene
 * Preislogik, keine Änderung an Collection-/PriceHistory-Daten (reiner
 * Read).
 *
 * Fehlt bei einer Position der Kaufpreis, sind Gewinn/Verlust/Performance
 * für DIESE Position `null` (nicht 0 – ein fehlender Kaufpreis bedeutet
 * "nicht berechenbar", nicht "kostenlos erworben"). Für die
 * Portfolio-Summen (totalPurchasePrice/totalProfit/totalLoss) tragen
 * solche Positionen mit ihrem Marktwert bei, aber ohne Kaufpreisanteil –
 * bewusste, dokumentierte Vereinfachung dieser Foundation, konsistent mit
 * calculateCollectionValue() aus Feature 40 (dort: fehlender Marktpreis
 * trägt 0 zur Summe bei, hier: fehlender Kaufpreis trägt 0 zur
 * Kaufpreis-Summe bei).
 */
export async function calculatePortfolio(userId: string): Promise<PortfolioResult> {
  const collection = await getOrCreateCollection(userId);

  const items = await prisma.collectionItem.findMany({
    where: { collectionId: collection.id },
    select: {
      id: true,
      cardId: true,
      quantity: true,
      language: true,
      condition: true,
      foil: true,
      purchasePrice: true,
      card: { select: { name: true, image: true, set: { select: { name: true } } } },
    },
  });

  const marketPrices = await Promise.all(
    items.map((item) => getCurrentMarketPrice(item.cardId)),
  );

  const positions: PortfolioPosition[] = items.map((item, index) => {
    const marketPriceValue = marketPrices[index].currentPrice;
    const marketPrice = marketPriceValue ? new Prisma.Decimal(marketPriceValue) : null;
    const purchasePrice = item.purchasePrice;

    const totalMarketValue = (marketPrice ?? new Prisma.Decimal(0)).times(item.quantity);
    const totalPositionPurchasePrice = purchasePrice ? purchasePrice.times(item.quantity) : null;

    const profitLoss = totalPositionPurchasePrice
      ? totalMarketValue.minus(totalPositionPurchasePrice)
      : null;
    const profitLossPercent =
      profitLoss && totalPositionPurchasePrice && !totalPositionPurchasePrice.isZero()
        ? profitLoss.dividedBy(totalPositionPurchasePrice).times(100)
        : null;

    return {
      collectionItemId: item.id,
      cardId: item.cardId,
      cardName: item.card.name,
      cardImage: item.card.image,
      setName: item.card.set.name,
      language: item.language,
      condition: item.condition,
      foil: item.foil,
      quantity: item.quantity,
      purchasePricePerUnit: purchasePrice?.toFixed(2) ?? null,
      marketPricePerUnit: marketPrice?.toFixed(2) ?? null,
      totalPurchasePrice: totalPositionPurchasePrice?.toFixed(2) ?? null,
      totalMarketValue: totalMarketValue.toFixed(2),
      profitLoss: profitLoss?.toFixed(2) ?? null,
      profitLossPercent: profitLossPercent?.toFixed(2) ?? null,
    };
  });

  // Zweiter, einfacher Durchlauf für alle Aggregate/Top-Einträge – bewusst
  // getrennt von der Positions-Berechnung oben (u. a. vermeidet das ein
  // TypeScript-Problem mit Control-Flow-Narrowing von `let`-Variablen, die
  // innerhalb eines .map()-Callbacks neu zugewiesen werden).
  let totalValue = new Prisma.Decimal(0);
  let totalPurchasePrice = new Prisma.Decimal(0);
  let totalProfit = new Prisma.Decimal(0);
  let totalLoss = new Prisma.Decimal(0);
  let totalCardCount = 0;
  let mostExpensiveCard: PortfolioTopEntry | null = null;
  let mostExpensiveCardPrice = new Prisma.Decimal(-1);
  let mostValuablePosition: PortfolioTopEntry | null = null;
  let mostValuablePositionValue = new Prisma.Decimal(-1);

  for (const position of positions) {
    totalValue = totalValue.plus(position.totalMarketValue);
    totalCardCount += position.quantity;

    if (position.totalPurchasePrice !== null) {
      totalPurchasePrice = totalPurchasePrice.plus(position.totalPurchasePrice);
    }

    if (position.profitLoss !== null) {
      const profitLoss = new Prisma.Decimal(position.profitLoss);
      if (profitLoss.greaterThan(0)) {
        totalProfit = totalProfit.plus(profitLoss);
      } else if (profitLoss.lessThan(0)) {
        totalLoss = totalLoss.plus(profitLoss.abs());
      }
    }

    if (position.marketPricePerUnit !== null) {
      const marketPrice = new Prisma.Decimal(position.marketPricePerUnit);
      if (marketPrice.greaterThan(mostExpensiveCardPrice)) {
        mostExpensiveCardPrice = marketPrice;
        mostExpensiveCard = {
          collectionItemId: position.collectionItemId,
          cardId: position.cardId,
          cardName: position.cardName,
          value: position.marketPricePerUnit,
        };
      }
    }

    const totalMarketValue = new Prisma.Decimal(position.totalMarketValue);
    if (totalMarketValue.greaterThan(mostValuablePositionValue)) {
      mostValuablePositionValue = totalMarketValue;
      mostValuablePosition = {
        collectionItemId: position.collectionItemId,
        cardId: position.cardId,
        cardName: position.cardName,
        value: position.totalMarketValue,
      };
    }
  }

  const uniqueCardCount = new Set(items.map((item) => item.cardId)).size;
  const averageCardValue =
    totalCardCount === 0 ? new Prisma.Decimal(0) : totalValue.dividedBy(totalCardCount);
  const performancePercent = !totalPurchasePrice.isZero()
    ? totalValue.minus(totalPurchasePrice).dividedBy(totalPurchasePrice).times(100).toFixed(2)
    : null;

  return {
    totalValue: totalValue.toFixed(2),
    totalPurchasePrice: totalPurchasePrice.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    totalLoss: totalLoss.toFixed(2),
    performancePercent,
    totalCardCount,
    uniqueCardCount,
    averageCardValue: averageCardValue.toFixed(2),
    mostExpensiveCard,
    mostValuablePosition,
    positions,
  };
}
