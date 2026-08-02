import { prisma } from "@/lib/prisma";

const MAX_RESULTS = 20;

export interface CardSearchResult {
  id: string;
  name: string;
  cardNumber: string;
  image: string;
  set: { name: string };
  game: { name: string };
}

/**
 * Sucht Karten anhand des Namens (Teilstring, Groß-/Kleinschreibung
 * ignorierend), alphabetisch sortiert, maximal MAX_RESULTS Treffer.
 */
export async function searchCards(query: string): Promise<CardSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return prisma.card.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: MAX_RESULTS,
    select: {
      id: true,
      name: true,
      cardNumber: true,
      image: true,
      set: { select: { name: true } },
      game: { select: { name: true } },
    },
  });
}
