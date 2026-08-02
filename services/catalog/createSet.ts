import { prisma } from "@/lib/prisma";
import { slugify } from "@/utils/slugify";

import { DuplicateSetCodeError, GameNotFoundError } from "./errors";

export interface CreateSetInput {
  gameId: string;
  name: string;
  code: string;
  releaseDate: Date;
  totalCards: number;
  symbol: string;
  coverImage?: string;
}

export interface CreateSetResult {
  id: string;
  slug: string;
  name: string;
  code: string;
}

/**
 * Legt ein Set innerhalb eines Games an. `code` muss innerhalb des Games
 * eindeutig sein (wird vorab geprüft). `slug` wird automatisch aus `name`
 * abgeleitet (siehe utils/slugify.ts) – die bestehende Set.slug-Spalte
 * bleibt dadurch befüllt, ohne dass der Aufrufer sie explizit angeben muss.
 * `symbol` wird auf die bestehende Spalte `symbolImage` gemappt (gleiche
 * Bedeutung, ursprünglicher Spaltenname bleibt unverändert).
 */
export async function createSet(input: CreateSetInput): Promise<CreateSetResult> {
  const game = await prisma.game.findUnique({ where: { id: input.gameId }, select: { id: true } });

  if (!game) {
    throw new GameNotFoundError();
  }

  const existingCode = await prisma.set.findFirst({
    where: { gameId: input.gameId, code: input.code },
    select: { id: true },
  });

  if (existingCode) {
    throw new DuplicateSetCodeError();
  }

  return prisma.set.create({
    data: {
      gameId: input.gameId,
      name: input.name,
      slug: slugify(input.name),
      code: input.code,
      releaseDate: input.releaseDate,
      totalCards: input.totalCards,
      symbolImage: input.symbol,
      coverImage: input.coverImage,
    },
    select: { id: true, slug: true, name: true, code: true },
  });
}
