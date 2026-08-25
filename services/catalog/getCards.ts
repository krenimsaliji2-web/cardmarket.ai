import { prisma } from "@/lib/prisma";

export interface CardListItem {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  image: string;
}

export interface GetCardsResult {
  game: { id: string; slug: string; name: string } | null;
  set: { id: string; slug: string; name: string; code: string; totalCards: number } | null;
  cards: CardListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 60;

/**
 * Lädt alle Karten eines Sets (identifiziert über Spiel-Slug + Set-Code,
 * die in der URL /catalog/[game]/[set] vorkommenden Werte) inklusive
 * Spiel-/Set-Infos für den Seitenkopf – eine gebündelte Antwort für genau
 * diese Route, kein Prisma-Zugriff dort nötig. `select` statt `include`
 * überall, keine unnötigen Felder (z. B. kein description/artist in der
 * Listenansicht).
 *
 * cardNumber ist ein String-Feld ("1", "10", "2", …) – für eine natürliche
 * statt lexikographische Sortierung wird nach dem Laden in JS sortiert
 * (gleiches Muster wie an anderer Stelle im Projekt bereits für
 * cardNumber-Sortierung etabliert), erst danach paginiert.
 */
export async function getCards(
  gameSlug: string,
  setCode: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<GetCardsResult> {
  const game = await prisma.game.findUnique({
    where: { slug: gameSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!game) {
    return { game: null, set: null, cards: [], total: 0, page, pageSize };
  }

  const set = await prisma.set.findFirst({
    where: { gameId: game.id, code: setCode },
    select: { id: true, slug: true, name: true, code: true, totalCards: true },
  });

  if (!set) {
    return { game, set: null, cards: [], total: 0, page, pageSize };
  }

  const cards = await prisma.card.findMany({
    where: { setId: set.id },
    select: { id: true, cardNumber: true, name: true, rarity: true, image: true },
  });

  const sorted = [...cards].sort((a, b) =>
    a.cardNumber.localeCompare(b.cardNumber, undefined, { numeric: true }),
  );

  const safePage = page > 0 ? page : 1;
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  return { game, set, cards: paged, total: sorted.length, page: safePage, pageSize };
}

export interface CardDetailResult {
  id: string;
  cardNumber: string;
  name: string;
  rarity: string;
  image: string;
  artist: string;
  hp: number | null;
  cardType: string;
  language: string;
  types: string[];
  subtypes: string[];
  supertype: string | null;
  evolvesFrom: string | null;
  description: string | null;
  game: { slug: string; name: string };
  set: { slug: string; code: string; name: string };
}

/**
 * Lädt die Details einer einzelnen Karte inkl. Spiel/Set für
 * /catalog/card/[id]. Kein eigener Dateiname laut Vorgabe (nur getCards.ts/
 * searchCards.ts sind in der Feature-Spec vorgesehen) – lebt deshalb hier,
 * da thematisch identisch ("Karten laden").
 */
export async function getCardById(id: string): Promise<CardDetailResult | null> {
  const card = await prisma.card.findUnique({
    where: { id },
    select: {
      id: true,
      cardNumber: true,
      name: true,
      rarity: true,
      image: true,
      artist: true,
      hp: true,
      cardType: true,
      language: true,
      types: true,
      subtypes: true,
      supertype: true,
      evolvesFrom: true,
      description: true,
      game: { select: { slug: true, name: true } },
      set: { select: { slug: true, code: true, name: true } },
    },
  });

  if (!card) {
    return null;
  }

  // types/subtypes sind Json statt eines nativen Arrays (MariaDB-Umstellung
  // – siehe prisma/schema.prisma), werden aber ausschließlich als
  // String-Arrays geschrieben (createCard.ts) – hier entsprechend typisiert.
  return { ...card, types: card.types as string[], subtypes: card.subtypes as string[] };
}
