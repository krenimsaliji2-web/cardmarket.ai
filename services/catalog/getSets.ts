import { prisma } from "@/lib/prisma";

export interface SetListItem {
  id: string;
  slug: string;
  name: string;
  code: string;
  releaseDate: Date;
  totalCards: number;
  symbol: string;
  cardCount: number;
}

export interface GetSetsResult {
  game: { id: string; slug: string; name: string; logo: string | null } | null;
  sets: SetListItem[];
}

/**
 * Lädt Sets, optional gefiltert nach Spiel (`gameSlug`). Wird ein Slug
 * übergeben, löst diese Funktion auch das Game selbst auf (id/slug/name/
 * logo) – damit die Route /catalog/[game] Header-Infos + Set-Liste über
 * einen einzigen Service-Aufruf bekommt, ohne selbst Prisma anzufassen.
 * Existiert kein Game mit diesem Slug, wird `game: null, sets: []`
 * zurückgegeben (die Route zeigt dann notFound()).
 */
export async function getSets(gameSlug?: string): Promise<GetSetsResult> {
  let gameId: string | undefined;
  let game: GetSetsResult["game"] = null;

  if (gameSlug) {
    const foundGame = await prisma.game.findUnique({
      where: { slug: gameSlug },
      select: { id: true, slug: true, name: true, logo: true },
    });

    if (!foundGame) {
      return { game: null, sets: [] };
    }

    game = foundGame;
    gameId = foundGame.id;
  }

  const sets = await prisma.set.findMany({
    where: gameId ? { gameId } : undefined,
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      code: true,
      releaseDate: true,
      totalCards: true,
      symbolImage: true,
      _count: { select: { cards: true } },
    },
  });

  return {
    game,
    sets: sets.map((set) => ({
      id: set.id,
      slug: set.slug,
      name: set.name,
      code: set.code,
      releaseDate: set.releaseDate,
      totalCards: set.totalCards,
      symbol: set.symbolImage,
      cardCount: set._count.cards,
    })),
  };
}
