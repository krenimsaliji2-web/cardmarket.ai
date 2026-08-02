import type { GameModel } from "@/prisma/generated/prisma/models";
import { slugify } from "@/utils/slugify";

import { BaseImporter, type ImportResult } from "./BaseImporter";

const POKEMON_TCG_API_BASE_URL = "https://api.pokemontcg.io/v2";
const SETS_PAGE_SIZE = 250;
const CARDS_PAGE_SIZE = 250;

/**
 * Pilot-Einschränkung für importCards(): Es wird bewusst nur dieses eine Set
 * importiert, nicht der komplette Kartenbestand. Der Parameter ist jederzeit
 * austauschbar – siehe importCards().
 */
const PILOT_SET_CODES: readonly string[] = ["base1"];

/** Rarity-Wert für Basic-Energy-Karten, die von der API ohne "rarity" geliefert werden. */
const FALLBACK_RARITY = "Common";
const FALLBACK_ARTIST = "Unbekannt";

interface PokemonTcgSet {
  id: string;
  name: string;
  releaseDate: string; // Format der API: "YYYY/MM/DD"
  total: number;
  images: {
    symbol: string;
    logo: string;
  };
}

interface PokemonTcgSetsResponse {
  data: PokemonTcgSet[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

interface PokemonTcgCard {
  id: string;
  name: string;
  number: string;
  supertype: string; // "Pokémon" | "Trainer" | "Energy"
  rarity?: string;
  artist?: string;
  hp?: string;
  evolvesFrom?: string;
  flavorText?: string;
  images: {
    small: string;
    large: string;
  };
}

interface PokemonTcgCardsResponse {
  data: PokemonTcgCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

/**
 * Importer für Pokémon.
 *
 * Datenquelle: öffentliche Pokémon TCG API (https://pokemontcg.io).
 * Ein API-Key ist für Lesezugriffe nicht zwingend erforderlich, wird aber
 * empfohlen (höheres Rate-Limit). Wenn `POKEMON_TCG_API_KEY` gesetzt ist,
 * wird er automatisch mitgesendet.
 */
export class PokemonImporter extends BaseImporter {
  readonly gameSlug = "pokemon";
  readonly gameName = "Pokémon";

  /** Legt das Game "Pokémon" an, falls es noch nicht existiert. */
  async importGames(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    try {
      const { created } = await this.getOrCreateGame();
      if (created) {
        result.created += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Import"));
    }

    return result;
  }

  /** Importiert alle Sets von der Pokémon TCG API (upsert, keine Duplikate). */
  async importSets(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    let apiSets: PokemonTcgSet[];
    try {
      apiSets = await this.fetchAllSets();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Sets von der Pokémon TCG API"));
      return result;
    }

    for (const apiSet of apiSets) {
      try {
        const releaseDate = this.parseReleaseDate(apiSet.releaseDate);
        const existing = await this.prisma.set.findUnique({
          where: { gameId_code: { gameId: game.id, code: apiSet.id } },
          select: { id: true },
        });

        await this.prisma.set.upsert({
          where: { gameId_code: { gameId: game.id, code: apiSet.id } },
          update: {
            name: apiSet.name,
            slug: slugify(apiSet.name),
            releaseDate,
            totalCards: apiSet.total,
            symbolImage: apiSet.images.symbol,
            coverImage: apiSet.images.logo,
          },
          create: {
            gameId: game.id,
            name: apiSet.name,
            slug: slugify(apiSet.name),
            code: apiSet.id,
            releaseDate,
            totalCards: apiSet.total,
            symbolImage: apiSet.images.symbol,
            coverImage: apiSet.images.logo,
          },
        });

        if (existing) {
          result.updated += 1;
        } else {
          result.created += 1;
        }
      } catch (error) {
        result.errors.push(
          this.toErrorMessage(error, `Set "${apiSet.name}" (${apiSet.id})`),
        );
      }
    }

    return result;
  }

  /**
   * Importiert Karten für die angegebenen Sets (Set-`code`, z. B. "base1").
   *
   * Pilot-Einschränkung: Standardmäßig wird nur `PILOT_SET_CODES` (aktuell
   * `["base1"]`) importiert, nicht der komplette Kartenbestand. Um später
   * weitere oder alle Sets zu importieren, einfach die entsprechenden
   * Set-Codes übergeben, z. B.:
   *
   * ```ts
   * const allCodes = (await prisma.set.findMany({
   *   where: { game: { slug: "pokemon" } },
   *   select: { code: true },
   * })).map((s) => s.code);
   * await importer.importCards(allCodes);
   * ```
   */
  async importCards(setCodes: readonly string[] = PILOT_SET_CODES): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    for (const setCode of setCodes) {
      const set = await this.prisma.set.findUnique({
        where: { gameId_code: { gameId: game.id, code: setCode } },
        select: { id: true, code: true, name: true },
      });

      if (!set) {
        result.errors.push(
          `Set mit Code "${setCode}" existiert noch nicht lokal. Bitte zuerst importSets() ausführen.`,
        );
        continue;
      }

      let apiCards: PokemonTcgCard[];
      try {
        apiCards = await this.fetchCardsForSet(setCode);
      } catch (error) {
        result.errors.push(
          this.toErrorMessage(error, `Abruf der Karten für Set "${set.name}" (${setCode})`),
        );
        continue;
      }

      for (const apiCard of apiCards) {
        try {
          const existing = await this.prisma.card.findUnique({
            where: {
              setId_cardNumber_language: {
                setId: set.id,
                cardNumber: apiCard.number,
                language: "EN",
              },
            },
            select: { id: true },
          });

          const data = {
            gameId: game.id,
            setId: set.id,
            name: apiCard.name,
            cardNumber: apiCard.number,
            rarity: apiCard.rarity ?? FALLBACK_RARITY,
            language: "EN",
            image: apiCard.images.large ?? apiCard.images.small,
            artist: apiCard.artist ?? FALLBACK_ARTIST,
            cardType: apiCard.supertype,
            hp: this.parseHp(apiCard.hp),
            evolvesFrom: apiCard.evolvesFrom ?? null,
            description: apiCard.flavorText ?? null,
          };

          await this.prisma.card.upsert({
            where: {
              setId_cardNumber_language: {
                setId: set.id,
                cardNumber: apiCard.number,
                language: "EN",
              },
            },
            update: data,
            create: data,
          });

          if (existing) {
            result.updated += 1;
          } else {
            result.created += 1;
          }
        } catch (error) {
          result.errors.push(
            this.toErrorMessage(error, `Karte "${apiCard.name}" (${apiCard.id})`),
          );
        }
      }
    }

    return result;
  }

  private async getOrCreateGame(): Promise<{ game: GameModel; created: boolean }> {
    const existing = await this.prisma.game.findUnique({
      where: { slug: this.gameSlug },
    });

    if (existing) {
      return { game: existing, created: false };
    }

    const game = await this.prisma.game.create({
      data: {
        name: this.gameName,
        slug: this.gameSlug,
        isActive: true,
      },
    });

    return { game, created: true };
  }

  private async fetchAllSets(): Promise<PokemonTcgSet[]> {
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const sets: PokemonTcgSet[] = [];
    let page = 1;

    while (true) {
      const url = new URL(`${POKEMON_TCG_API_BASE_URL}/sets`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(SETS_PAGE_SIZE));

      const response = await fetch(url, {
        headers: apiKey ? { "X-Api-Key": apiKey } : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `Pokémon TCG API antwortete mit ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as PokemonTcgSetsResponse;
      sets.push(...body.data);

      const hasMore = sets.length < body.totalCount && body.data.length === SETS_PAGE_SIZE;
      if (!hasMore) {
        break;
      }
      page += 1;
    }

    return sets;
  }

  private async fetchCardsForSet(setCode: string): Promise<PokemonTcgCard[]> {
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    const cards: PokemonTcgCard[] = [];
    let page = 1;

    while (true) {
      const url = new URL(`${POKEMON_TCG_API_BASE_URL}/cards`);
      url.searchParams.set("q", `set.id:${setCode}`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(CARDS_PAGE_SIZE));

      const response = await fetch(url, {
        headers: apiKey ? { "X-Api-Key": apiKey } : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `Pokémon TCG API antwortete mit ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as PokemonTcgCardsResponse;
      cards.push(...body.data);

      const hasMore = cards.length < body.totalCount && body.data.length === CARDS_PAGE_SIZE;
      if (!hasMore) {
        break;
      }
      page += 1;
    }

    return cards;
  }

  /** Die API liefert "hp" als String (z. B. "80") oder gar nicht (Trainer/Energy). */
  private parseHp(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /** Die Pokémon-TCG-API liefert Datumsangaben als "YYYY/MM/DD". */
  private parseReleaseDate(value: string): Date {
    const isoValue = value.replaceAll("/", "-");
    const date = new Date(isoValue);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Ungültiges releaseDate von der API: "${value}"`);
    }

    return date;
  }

  private toErrorMessage(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : "unbekannter Fehler";
    return `${context}: ${message}`;
  }
}
