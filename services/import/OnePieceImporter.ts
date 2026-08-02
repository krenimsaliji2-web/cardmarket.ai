import type { GameModel } from "@/prisma/generated/prisma/models";
import { slugify } from "@/utils/slugify";

import { BaseImporter, type ImportResult } from "./BaseImporter";

const API_BASE_URL = "https://api.apitcg.com/api";
/** Höchster von der API akzeptierter Wert – minimiert die Zahl der Requests. */
const PAGE_LIMIT = 1000;

const FALLBACK_RARITY = "Common";
const FALLBACK_ARTIST = "Unbekannt";
const FALLBACK_RELEASE_DATE = new Date("2000-01-01");

interface OnePieceApiSet {
  code: string;
  name: string;
  slug: string;
  release_date?: string;
}

interface OnePieceApiCard {
  type: string;
  name: string;
  code: string;
  set?: OnePieceApiSet;
  images: { small?: string; medium?: string; large?: string }[];
  attributes: {
    Rarity?: string;
    Description?: string;
    Color?: string;
    CardType?: string;
    Cost?: string;
    Power?: string;
    Subtypes?: string;
    Counterplus?: string;
    Attribute?: string;
    Artist?: string;
    Life?: string;
  };
}

interface OnePieceApiResponse {
  success: boolean;
  data: OnePieceApiCard[];
  total: number;
}

/**
 * Importer für das One Piece Card Game.
 *
 * Datenquelle: apitcg.com (https://apitcg.com), REST-API mit Pflicht-
 * API-Key (Header `x-api-key`, Umgebungsvariable `ONE_PIECE_API_KEY`).
 * Anders als bei den übrigen Spielen gibt es keine offizielle oder
 * schlüssellose Community-API für One Piece – apitcg.com verlangt eine
 * kostenlose Registrierung (https://apitcg.com/platform). Ohne gesetzten
 * Key liefern alle drei Methoden einen Fehler in ImportResult.errors statt
 * fehlzuschlagen oder Platzhalterdaten anzulegen.
 *
 * Die API kennt keinen eigenen Sets-Endpunkt und keine eigenen Set-Bilder:
 * Sets werden aus den `set`-Objekten der Kartenliste dedupliziert
 * (`/api/products?tcg=one-piece`, paginiert), das Bild der jeweils ersten
 * gefundenen Karte dient als Set-Symbol (wie bereits bei LorcanaImporter
 * für Sets ohne eigenes Bild).
 */
export class OnePieceImporter extends BaseImporter {
  readonly gameSlug = "one-piece-card-game";
  readonly gameName = "One Piece Card Game";

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

    const apiKeyError = this.requireApiKey();
    if (apiKeyError) {
      result.errors.push(apiKeyError);
      return result;
    }

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    interface SetAccumulator {
      set: OnePieceApiSet;
      symbolImage: string;
      cardCount: number;
    }
    const setsByCode = new Map<string, SetAccumulator>();

    try {
      for await (const card of this.fetchAllCards()) {
        if (!card.set?.code) {
          continue;
        }
        const image = card.images[0]?.large ?? card.images[0]?.medium ?? card.images[0]?.small;
        const existing = setsByCode.get(card.set.code);
        if (existing) {
          existing.cardCount += 1;
        } else if (image) {
          setsByCode.set(card.set.code, { set: card.set, symbolImage: image, cardCount: 1 });
        }
      }
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Karten/Sets von der apitcg.com-API"));
      return result;
    }

    for (const { set: apiSet, symbolImage, cardCount } of setsByCode.values()) {
      try {
        const existing = await this.prisma.set.findUnique({
          where: { gameId_code: { gameId: game.id, code: apiSet.code } },
          select: { id: true },
        });

        const data = {
          name: apiSet.name,
          slug: apiSet.slug || slugify(apiSet.name),
          releaseDate: this.parseReleaseDate(apiSet.release_date),
          totalCards: cardCount,
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

    const apiKeyError = this.requireApiKey();
    if (apiKeyError) {
      result.errors.push(apiKeyError);
      return result;
    }

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    const localSets = await this.prisma.set.findMany({
      where: { gameId: game.id },
      select: { id: true, code: true },
    });
    const setIdByCode = new Map(localSets.map((set) => [set.code, set.id]));
    // apitcg.com listet gelegentlich mehrere Kartenvarianten (z. B. Parallel-Art-
    // Reprints) unter demselben Code im selben Set – die erste gewinnt, weitere
    // werden übersprungen (gleiches Prinzip wie beim Yu-Gi-Oh!-Rarity-Duplikat).
    const seenCardCodes = new Set<string>();

    try {
      for await (const card of this.fetchAllCards()) {
        const setId = card.set?.code ? setIdByCode.get(card.set.code) : undefined;
        if (!setId || !card.code) {
          result.skipped += 1;
          continue;
        }

        const dedupeKey = `${setId}:${card.code}`;
        if (seenCardCodes.has(dedupeKey)) {
          result.skipped += 1;
          continue;
        }
        seenCardCodes.add(dedupeKey);

        const image = card.images[0]?.large ?? card.images[0]?.medium ?? card.images[0]?.small;
        if (!image) {
          result.errors.push(`Karte "${card.name}" (${card.code}): kein Bild verfügbar, übersprungen.`);
          continue;
        }

        const cardType = card.attributes.CardType ?? "Unbekannt";
        const subtypes = card.attributes.Subtypes
          ? card.attributes.Subtypes.split(";").map((s) => s.trim()).filter(Boolean)
          : [];

        try {
          const existing = await this.prisma.card.findUnique({
            where: { setId_cardNumber_language: { setId, cardNumber: card.code, language: "EN" } },
            select: { id: true },
          });

          const data = {
            gameId: game.id,
            setId,
            name: card.name,
            cardNumber: card.code,
            rarity: card.attributes.Rarity ?? FALLBACK_RARITY,
            language: "EN",
            image,
            artist: card.attributes.Artist ?? FALLBACK_ARTIST,
            cardType,
            description: card.attributes.Description ? this.stripHtml(card.attributes.Description) : null,
            supertype: cardType,
            types: [cardType],
            subtypes,
            attributes: {
              color: card.attributes.Color ?? null,
              cost: card.attributes.Cost ?? null,
              power: card.attributes.Power ?? null,
              counterplus: card.attributes.Counterplus ?? null,
              attribute: card.attributes.Attribute ?? null,
              life: card.attributes.Life ?? null,
            },
          };

          await this.prisma.card.upsert({
            where: { setId_cardNumber_language: { setId, cardNumber: card.code, language: "EN" } },
            update: data,
            create: data,
          });

          result[existing ? "updated" : "created"] += 1;
        } catch (error) {
          result.errors.push(this.toErrorMessage(error, `Karte "${card.name}" (${card.code})`));
        }
      }
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Karten von der apitcg.com-API"));
    }

    return result;
  }

  private requireApiKey(): string | null {
    if (!process.env.ONE_PIECE_API_KEY) {
      return "ONE_PIECE_API_KEY ist nicht gesetzt – Import übersprungen (siehe .env.example).";
    }
    return null;
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

  /** Streamt alle Karten seitenweise (PAGE_LIMIT je Anfrage) über die apitcg.com-API. */
  private async *fetchAllCards(): AsyncGenerator<OnePieceApiCard> {
    let page = 1;
    while (true) {
      const url = new URL(`${API_BASE_URL}/products`);
      url.searchParams.set("tcg", "one-piece");
      url.searchParams.set("limit", String(PAGE_LIMIT));
      url.searchParams.set("page", String(page));

      const response = await fetch(url, {
        headers: { "x-api-key": process.env.ONE_PIECE_API_KEY ?? "" },
      });
      if (!response.ok) {
        throw new Error(`apitcg.com-API antwortete mit ${response.status} ${response.statusText}`);
      }

      const body = (await response.json()) as OnePieceApiResponse;
      for (const card of body.data) {
        // apitcg.com liefert unter demselben Endpunkt auch versiegelte Produkte
        // (Booster-Boxen/-Packs, type "sealed") ohne Kartennummer – das sind
        // keine einzelnen, handelbaren Karten und werden übersprungen.
        if (card.type === "card") {
          yield card;
        }
      }

      if (body.data.length < PAGE_LIMIT || page * PAGE_LIMIT >= body.total) {
        break;
      }
      page += 1;
    }
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, "");
  }

  private parseReleaseDate(value: string | undefined): Date {
    if (!value) {
      return FALLBACK_RELEASE_DATE;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? FALLBACK_RELEASE_DATE : date;
  }

  private toErrorMessage(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : "unbekannter Fehler";
    return `${context}: ${message}`;
  }
}
