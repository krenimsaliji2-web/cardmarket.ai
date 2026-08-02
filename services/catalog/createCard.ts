import type { Prisma } from "@/prisma/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { DuplicateCardNumberError, GameNotFoundError, SetNotFoundError } from "./errors";

export interface CreateCardInput {
  gameId: string;
  setId: string;
  cardNumber: string;
  name: string;
  rarity: string;
  image: string;
  artist: string;
  // Bestehende Pflichtspalten (nicht Teil der neuen Catalog-Foundation-Spec,
  // aber weiterhin NOT NULL in der DB) – bleiben erforderlich, damit
  // bestehender Code, der sich auf sie verlässt, nicht bricht.
  language: string;
  cardType: string;
  hp?: number;
  types?: string[];
  subtypes?: string[];
  supertype?: string;
  evolvesFrom?: string;
  description?: string;
  attributes?: Prisma.InputJsonValue;
}

export interface CreateCardResult {
  id: string;
  name: string;
  cardNumber: string;
}

/**
 * Legt eine Karte in einem Set an. Eindeutigkeit folgt dem bestehenden
 * DB-Constraint @@unique([setId, cardNumber, language]) – bewusst NICHT
 * nur (cardNumber + setId) wie in der reinen Feature-Spec beschrieben,
 * weil die bestehende Card-Tabelle Sprachvarianten derselben Karte als
 * separate Zeilen führt (siehe prisma/schema.prisma) und dieses Verhalten
 * hier nicht rückwirkend geändert wird.
 */
export async function createCard(input: CreateCardInput): Promise<CreateCardResult> {
  const game = await prisma.game.findUnique({ where: { id: input.gameId }, select: { id: true } });
  if (!game) {
    throw new GameNotFoundError();
  }

  const set = await prisma.set.findUnique({ where: { id: input.setId }, select: { id: true } });
  if (!set) {
    throw new SetNotFoundError();
  }

  const existing = await prisma.card.findFirst({
    where: { setId: input.setId, cardNumber: input.cardNumber, language: input.language },
    select: { id: true },
  });

  if (existing) {
    throw new DuplicateCardNumberError();
  }

  return prisma.card.create({
    data: {
      gameId: input.gameId,
      setId: input.setId,
      cardNumber: input.cardNumber,
      name: input.name,
      rarity: input.rarity,
      image: input.image,
      artist: input.artist,
      language: input.language,
      cardType: input.cardType,
      hp: input.hp,
      types: input.types ?? [],
      subtypes: input.subtypes ?? [],
      supertype: input.supertype,
      evolvesFrom: input.evolvesFrom,
      description: input.description,
      attributes: input.attributes,
    },
    select: { id: true, name: true, cardNumber: true },
  });
}
