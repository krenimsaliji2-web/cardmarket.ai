import type { GameModel } from "@/prisma/generated/prisma/models";
import { slugify } from "@/utils/slugify";

import { BaseImporter, type ImportResult } from "./BaseImporter";

const LORCAST_API_BASE_URL = "https://api.lorcast.com/v0";

const FALLBACK_RARITY = "Common";
const FALLBACK_ARTIST = "Unbekannt";

interface LorcastSet {
  id: string;
  name: string;
  code: string;
  released_at?: string;
}

interface LorcastSetsResponse {
  results: LorcastSet[];
}

interface LorcastCard {
  name: string;
  version?: string;
  collector_number: string;
  rarity?: string;
  type?: string[];
  classifications?: string[];
  text?: string;
  flavor_text?: string;
  illustrators?: string[];
  cost?: number;
  ink?: string;
  inkwell?: boolean;
  strength?: number;
  willpower?: number;
  lore?: number;
  move_cost?: number | null;
  keywords?: string[];
  image_uris?: { digital?: { normal?: string; large?: string; small?: string } };
  set: { code: string; name: string };
}

/**
 * Importer für Disney Lorcana.
 *
 * Datenquelle: Lorcast API (https://lorcast.com/docs/api), eine freie,
 * offen dokumentierte Community-API nach dem Vorbild von Scryfall (siehe
 * MtgImporter) – kein API-Key erforderlich. Mit 20 Sets und wenigen
 * tausend Karten deutlich kleiner als Yu-Gi-Oh!/Magic, daher wie bei
 * PokemonImporter/YugiohImporter eine reguläre Anfrage pro Set statt
 * Bulk-Download.
 */
export class LorcanaImporter extends BaseImporter {
  readonly gameSlug = "disney-lorcana";
  readonly gameName = "Disney Lorcana";

  async importGames(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    try {
      const { created } = await this.getOrCreateGame();
      result.created += created ? 1 : 0;
      result.skipped += created ? 0 : 1;
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Import"));
    }

    return result;
  }

  async importSets(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    let apiSets: LorcastSet[];
    try {
      apiSets = await this.fetchAllSets();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Sets von der Lorcast-API"));
      return result;
    }

    for (const apiSet of apiSets) {
      try {
        const cards = await this.fetchCardsForSet(apiSet.code);
        const symbolImage = cards[0]?.image_uris?.digital?.normal ?? cards[0]?.image_uris?.digital?.large;
        if (!symbolImage) {
          result.errors.push(`Set "${apiSet.name}" (${apiSet.code}): kein Bild verfügbar, übersprungen.`);
          continue;
        }

        const existing = await this.prisma.set.findUnique({
          where: { gameId_code: { gameId: game.id, code: apiSet.code } },
          select: { id: true },
        });

        const data = {
          name: apiSet.name,
          slug: slugify(apiSet.name),
          releaseDate: this.parseReleaseDate(apiSet.released_at),
          totalCards: cards.length,
          symbolImage,
          coverImage: symbolImage,
        };

        await this.prisma.set.upsert({
          where: { gameId_code: { gameId: game.id, code: apiSet.code } },
          update: data,
          create: { gameId: game.id, code: apiSet.code, ...data },
        });

        result[existing ? "updated" : "created"] += 1;
      } catch (error) {
        result.errors.push(this.toErrorMessage(error, `Set "${apiSet.name}" (${apiSet.code})`));
      }
    }

    return result;
  }

  async importCards(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    const sets = await this.prisma.set.findMany({
      where: { gameId: game.id },
      select: { id: true, code: true, name: true },
    });

    for (const set of sets) {
      let apiCards: LorcastCard[];
      try {
        apiCards = await this.fetchCardsForSet(set.code);
      } catch (error) {
        result.errors.push(this.toErrorMessage(error, `Abruf der Karten für Set "${set.name}"`));
        continue;
      }

      for (const apiCard of apiCards) {
        const image = apiCard.image_uris?.digital?.normal ?? apiCard.image_uris?.digital?.large;
        if (!image) {
          result.errors.push(`Karte "${apiCard.name}" (${set.name} #${apiCard.collector_number}): kein Bild verfügbar, übersprungen.`);
          continue;
        }

        try {
          const existing = await this.prisma.card.findUnique({
            where: {
              setId_cardNumber_language: { setId: set.id, cardNumber: apiCard.collector_number, language: "EN" },
            },
            select: { id: true },
          });

          const cardType = apiCard.type?.[0] ?? "Unbekannt";
          const data = {
            gameId: game.id,
            setId: set.id,
            name: apiCard.version ? `${apiCard.name} - ${apiCard.version}` : apiCard.name,
            cardNumber: apiCard.collector_number,
            rarity: apiCard.rarity ?? FALLBACK_RARITY,
            language: "EN",
            image,
            artist: apiCard.illustrators?.[0] ?? FALLBACK_ARTIST,
            cardType,
            description: apiCard.text ?? apiCard.flavor_text ?? null,
            supertype: cardType,
            types: apiCard.type ?? [],
            subtypes: apiCard.classifications ?? [],
            attributes: {
              cost: apiCard.cost ?? null,
              ink: apiCard.ink ?? null,
              inkwell: apiCard.inkwell ?? null,
              strength: apiCard.strength ?? null,
              willpower: apiCard.willpower ?? null,
              lore: apiCard.lore ?? null,
              moveCost: apiCard.move_cost ?? null,
              keywords: apiCard.keywords ?? [],
            },
          };

          await this.prisma.card.upsert({
            where: {
              setId_cardNumber_language: { setId: set.id, cardNumber: apiCard.collector_number, language: "EN" },
            },
            update: data,
            create: data,
          });

          result[existing ? "updated" : "created"] += 1;
        } catch (error) {
          result.errors.push(this.toErrorMessage(error, `Karte "${apiCard.name}" (${set.name} #${apiCard.collector_number})`));
        }
      }
    }

    return result;
  }

  private async getOrCreateGame(): Promise<{ game: GameModel; created: boolean }> {
    const existing = await this.prisma.game.findUnique({ where: { slug: this.gameSlug } });
    if (existing) {
      return { game: existing, created: false };
    }
    const game = await this.prisma.game.create({
      data: { name: this.gameName, slug: this.gameSlug, isActive: true },
    });
    return { game, created: true };
  }

  private async fetchAllSets(): Promise<LorcastSet[]> {
    const response = await fetch(`${LORCAST_API_BASE_URL}/sets`);
    if (!response.ok) {
      throw new Error(`Lorcast API antwortete mit ${response.status} ${response.statusText}`);
    }
    const body = (await response.json()) as LorcastSetsResponse;
    return body.results;
  }

  private async fetchCardsForSet(setCode: string): Promise<LorcastCard[]> {
    const response = await fetch(`${LORCAST_API_BASE_URL}/sets/${encodeURIComponent(setCode)}/cards`);
    if (!response.ok) {
      throw new Error(`Lorcast API antwortete mit ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as LorcastCard[];
  }

  private parseReleaseDate(value: string | undefined): Date {
    if (!value) {
      return new Date("2000-01-01");
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date("2000-01-01") : date;
  }

  private toErrorMessage(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : "unbekannter Fehler";
    return `${context}: ${message}`;
  }
}
