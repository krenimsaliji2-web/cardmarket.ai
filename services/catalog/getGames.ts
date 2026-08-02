import { prisma } from "@/lib/prisma";

export interface GameListItem {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  setCount: number;
  cardCount: number;
}

/**
 * Lädt alle AKTIVEN Spiele inkl. Set-/Kartenanzahl (über Prisma `_count`,
 * eine einzige Query statt N+1) – für /catalog.
 */
export async function getGames(): Promise<GameListItem[]> {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      _count: { select: { sets: true, cards: true } },
    },
  });

  return games.map((game) => ({
    id: game.id,
    slug: game.slug,
    name: game.name,
    logo: game.logo,
    setCount: game._count.sets,
    cardCount: game._count.cards,
  }));
}
