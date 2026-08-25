import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/prisma/client";

export interface SearchCardsParams {
  /** Case-insensitive Teilstring-Suche über Kartenname UND Kartennummer. */
  query?: string;
  gameId?: string;
  setId?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchCardsItem {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  image: string;
  gameName: string;
  gameSlug: string;
  setName: string;
  setCode: string;
}

export interface SearchCardsResult {
  items: SearchCardsItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 24;

/**
 * Durchsucht den Kartenkatalog case-insensitive über Kartenname und
 * Kartennummer, kombinierbar mit Set-/Spiel-Filter. Echte DB-seitige
 * Pagination (skip/take + count), kein Overfetching – im Gegensatz zu
 * getCards() (dort wird bewusst pro Set komplett geladen, um cardNumber
 * numerisch zu sortieren) sortiert die Suche nach Name, da Ergebnisse hier
 * i. d. R. über mehrere Sets/Spiele gestreut sind und cardNumber allein
 * keine sinnvolle Sortierung mehr ergibt.
 */
export async function searchCards(params: SearchCardsParams = {}): Promise<SearchCardsResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const where: Prisma.CardWhereInput = {};
  if (params.gameId) {
    where.gameId = params.gameId;
  }
  if (params.setId) {
    where.setId = params.setId;
  }
  if (params.query) {
    where.OR = [
      { name: { contains: params.query } },
      { cardNumber: { contains: params.query } },
    ];
  }

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        cardNumber: true,
        name: true,
        rarity: true,
        image: true,
        game: { select: { name: true, slug: true } },
        set: { select: { name: true, code: true } },
      },
    }),
    prisma.card.count({ where }),
  ]);

  return {
    items: cards.map((card) => ({
      id: card.id,
      cardNumber: card.cardNumber,
      name: card.name,
      rarity: card.rarity,
      image: card.image,
      gameName: card.game.name,
      gameSlug: card.game.slug,
      setName: card.set.name,
      setCode: card.set.code,
    })),
    total,
    page,
    pageSize,
  };
}
