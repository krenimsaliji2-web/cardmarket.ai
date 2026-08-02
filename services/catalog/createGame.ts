import { prisma } from "@/lib/prisma";

import { DuplicateSlugError } from "./errors";

export interface CreateGameInput {
  slug: string;
  name: string;
  logo?: string;
  isActive?: boolean;
}

export interface CreateGameResult {
  id: string;
  slug: string;
  name: string;
}

/**
 * Legt ein neues Sammelkartenspiel an. Der Slug muss eindeutig sein (wird
 * vorab geprüft, damit ein sauberer Domain-Error statt eines rohen
 * Prisma-Unique-Constraint-Fehlers zurückkommt).
 */
export async function createGame(input: CreateGameInput): Promise<CreateGameResult> {
  const existing = await prisma.game.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existing) {
    throw new DuplicateSlugError();
  }

  return prisma.game.create({
    data: {
      slug: input.slug,
      name: input.name,
      logo: input.logo,
      isActive: input.isActive ?? true,
    },
    select: { id: true, slug: true, name: true },
  });
}
