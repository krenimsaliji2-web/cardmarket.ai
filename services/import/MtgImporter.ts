import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

import type { GameModel } from "@/prisma/generated/prisma/models";
import { slugify } from "@/utils/slugify";

import { BaseImporter, type ImportResult } from "./BaseImporter";

const SCRYFALL_API_BASE_URL = "https://api.scryfall.com";
/**
 * Scryfall lehnt Requests mit einem generischen HTTP-Library-Default-User-
 * Agent explizit ab (400 "generic_user_agent", siehe
 * https://scryfall.com/docs/api). Ein aussagekräftiger, projektbezogener
 * User-Agent ist deshalb Pflicht, kein optionales Detail.
 */
const SCRYFALL_REQUEST_HEADERS = {
  "User-Agent": "ProjectAtlas/1.0 (Trading-Card-Marktplatz-Katalogimport)",
  Accept: "application/json",
};

/** Set-Typen ohne reguläre, einzeln handelbare Karten (reine Token-/Memorabilia-Produkte). */
const EXCLUDED_SET_TYPES = new Set(["token", "memorabilia", "vanguard"]);
/** Karten-Layouts ohne eigenständige, handelbare Karte (Tokens, Kunstkarten, Spielhilfen). */
const EXCLUDED_LAYOUTS = new Set([
  "token",
  "double_faced_token",
  "art_series",
  "emblem",
  "scheme",
  "vanguard",
  "planar",
]);
const FALLBACK_ARTIST = "Unbekannt";
/** DB-Schreiboperationen laufen mit begrenzter Nebenläufigkeit statt streng seriell (siehe Klassendoku). */
const UPSERT_CONCURRENCY = 20;
/** Puffergröße für den JSONL-Stream, bevor ein Batch parallel geschrieben wird. */
const BATCH_SIZE = 500;

interface ScryfallSet {
  code: string;
  name: string;
  set_type: string;
  released_at?: string;
  card_count: number;
  digital: boolean;
  icon_svg_uri: string;
}

interface ScryfallSetsResponse {
  data: ScryfallSet[];
}

interface ScryfallCardFace {
  name?: string;
  oracle_text?: string;
  image_uris?: { normal?: string; small?: string };
}

interface ScryfallCard {
  name: string;
  lang: string;
  set: string;
  collector_number: string;
  rarity: string;
  artist?: string;
  type_line?: string;
  oracle_text?: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  keywords?: string[];
  layout: string;
  games?: string[];
  image_uris?: { normal?: string; small?: string };
  card_faces?: ScryfallCardFace[];
}

interface BulkDataInfo {
  type: string;
  jsonl_download_uri: string;
}

interface BulkDataResponse {
  data: BulkDataInfo[];
}

/**
 * Importer für Magic: The Gathering.
 *
 * Datenquelle: Scryfall API (https://scryfall.com/docs/api), frei nutzbar
 * ohne API-Key. Sets kommen über den regulären `/sets`-Endpoint (ca. 1000
 * Einträge, eine Anfrage). Für Karten empfiehlt Scryfall selbst ausdrücklich
 * NICHT die paginierte Such-API für Massenabrufe zu verwenden, sondern die
 * bereitgestellten Bulk-Data-Dateien (siehe
 * https://scryfall.com/docs/api/bulk-data) – deshalb weicht importCards()
 * strukturell von PokemonImporter/YugiohImporter ab (ein einziger
 * gestreamter Datei-Download statt ein API-Call pro Set). Grund: Mit ca.
 * 675 realen Sets und ~98.000 Karten (Papier, Englisch, ohne Tokens/
 * Kunstkarten) ist Magic um ein Vielfaches größer als jedes andere
 * unterstützte Spiel – eine Anfrage pro Set wäre laut Scryfall-Richtlinie
 * unangemessen und würde in der Praxis sehr lange dauern.
 *
 * Datenbank-Schreibzugriffe laufen dennoch nach demselben Prinzip wie bei
 * den anderen Importern (ein upsert je Karte, idempotent, keine Duplikate),
 * nur mit begrenzter Nebenläufigkeit (siehe UPSERT_CONCURRENCY) statt streng
 * seriell – bei ~98.000 Karten ist ein rein sequenzieller Ablauf nicht mehr
 * praktikabel ("keine unnötigen Datenbankabfragen" schließt unnötig lange
 * Laufzeiten mit ein). Ob eine Karte neu oder aktualisiert wurde, wird ohne
 * zusätzliche Lese-Query direkt aus dem upsert-Ergebnis abgeleitet
 * (createdAt ≈ updatedAt bei Neuanlage), statt vorher separat nachzuschauen.
 */
export class MtgImporter extends BaseImporter {
  readonly gameSlug = "magic-the-gathering";
  readonly gameName = "Magic: The Gathering";

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

    let apiSets: ScryfallSet[];
    try {
      apiSets = await this.fetchAllSets();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Sets von der Scryfall-API"));
      return result;
    }

    for (const apiSet of apiSets) {
      if (apiSet.digital || EXCLUDED_SET_TYPES.has(apiSet.set_type)) {
        result.skipped += 1;
        continue;
      }

      try {
        const existing = await this.prisma.set.findUnique({
          where: { gameId_code: { gameId: game.id, code: apiSet.code } },
          select: { id: true },
        });

        const data = {
          name: apiSet.name,
          slug: slugify(apiSet.name),
          releaseDate: this.parseReleaseDate(apiSet.released_at),
          totalCards: apiSet.card_count,
          symbolImage: apiSet.icon_svg_uri,
          coverImage: apiSet.icon_svg_uri,
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

    const localSets = await this.prisma.set.findMany({
      where: { gameId: game.id },
      select: { id: true, code: true },
    });
    const setIdByCode = new Map(localSets.map((set) => [set.code, set.id]));

    let downloadUrl: string;
    try {
      downloadUrl = await this.fetchBulkDataUrl();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Scryfall-Bulk-Data-URL"));
      return result;
    }

    let processed = 0;
    let batch: ScryfallCard[] = [];

    const flushBatch = async () => {
      if (batch.length === 0) {
        return;
      }
      const currentBatch = batch;
      batch = [];
      await this.runWithConcurrency(currentBatch, UPSERT_CONCURRENCY, async (card) => {
        const outcome = await this.upsertCard(card, game.id, setIdByCode);
        result[outcome] += 1;
      });
    };

    try {
      for await (const card of this.streamBulkCards(downloadUrl)) {
        if (!this.isImportable(card)) {
          continue;
        }
        batch.push(card);
        processed += 1;

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
        if (processed % 10000 === 0) {
          console.log(`[MtgImporter] ${processed} Karten verarbeitet…`);
        }
      }
      await flushBatch();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Verarbeitung der Scryfall-Bulk-Daten"));
    }

    return result;
  }

  private async upsertCard(
    card: ScryfallCard,
    gameId: string,
    setIdByCode: Map<string, string>,
  ): Promise<"created" | "updated" | "skipped"> {
    const setId = setIdByCode.get(card.set);
    if (!setId) {
      // Set wurde beim Set-Import ausgeschlossen (Token/Memorabilia/digital) oder ist unbekannt.
      return "skipped";
    }

    const image = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal;
    if (!image) {
      return "skipped";
    }

    const typeLine = card.type_line ?? card.card_faces?.[0]?.name ?? "";
    const [mainTypes, subTypes] = this.splitTypeLine(typeLine);

    const data = {
      gameId,
      setId,
      name: card.name,
      cardNumber: card.collector_number,
      rarity: card.rarity,
      language: "EN",
      image,
      artist: card.artist ?? FALLBACK_ARTIST,
      cardType: typeLine,
      description: card.oracle_text ?? card.card_faces?.[0]?.oracle_text ?? null,
      supertype: mainTypes[0] ?? null,
      types: mainTypes,
      subtypes: subTypes,
      attributes: {
        manaCost: card.mana_cost ?? null,
        cmc: card.cmc ?? null,
        colors: card.colors ?? [],
        colorIdentity: card.color_identity ?? [],
        power: card.power ?? null,
        toughness: card.toughness ?? null,
        loyalty: card.loyalty ?? null,
        keywords: card.keywords ?? [],
      },
    };

    try {
      const upserted = await this.prisma.card.upsert({
        where: {
          setId_cardNumber_language: { setId, cardNumber: card.collector_number, language: "EN" },
        },
        update: data,
        create: data,
        select: { createdAt: true, updatedAt: true },
      });

      const isNew = Math.abs(upserted.updatedAt.getTime() - upserted.createdAt.getTime()) < 2000;
      return isNew ? "created" : "updated";
    } catch (error) {
      console.error(`[MtgImporter] Karte "${card.name}" (${card.set} ${card.collector_number}): ${this.toErrorMessage(error, "upsert")}`);
      return "skipped";
    }
  }

  private isImportable(card: ScryfallCard): boolean {
    return (
      card.lang === "en" &&
      Boolean(card.games?.includes("paper")) &&
      !EXCLUDED_LAYOUTS.has(card.layout)
    );
  }

  /** "Legendary Creature — Human Wizard" -> [["Legendary","Creature"], ["Human","Wizard"]]. */
  private splitTypeLine(typeLine: string): [string[], string[]] {
    const [main, sub] = typeLine.split("—").map((part) => part.trim());
    const mainTypes = main ? main.split(/\s+/).filter(Boolean) : [];
    const subTypes = sub ? sub.split(/\s+/).filter(Boolean) : [];
    return [mainTypes, subTypes];
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

  private async fetchAllSets(): Promise<ScryfallSet[]> {
    const response = await fetch(`${SCRYFALL_API_BASE_URL}/sets`, { headers: SCRYFALL_REQUEST_HEADERS });
    if (!response.ok) {
      throw new Error(`Scryfall API antwortete mit ${response.status} ${response.statusText}`);
    }
    const body = (await response.json()) as ScryfallSetsResponse;
    return body.data;
  }

  private async fetchBulkDataUrl(): Promise<string> {
    const response = await fetch(`${SCRYFALL_API_BASE_URL}/bulk-data`, { headers: SCRYFALL_REQUEST_HEADERS });
    if (!response.ok) {
      throw new Error(`Scryfall API antwortete mit ${response.status} ${response.statusText}`);
    }
    const body = (await response.json()) as BulkDataResponse;
    const defaultCards = body.data.find((item) => item.type === "default_cards");
    if (!defaultCards) {
      throw new Error("Scryfall-Bulk-Data enthält keinen 'default_cards'-Eintrag.");
    }
    return defaultCards.jsonl_download_uri;
  }

  /** Streamt die gzip-komprimierte JSONL-Bulk-Datei zeilenweise, ohne sie vollständig in den Speicher zu laden. */
  private async *streamBulkCards(url: string): AsyncGenerator<ScryfallCard> {
    const response = await fetch(url, { headers: SCRYFALL_REQUEST_HEADERS });
    if (!response.ok || !response.body) {
      throw new Error(`Download der Bulk-Daten fehlgeschlagen: ${response.status} ${response.statusText}`);
    }

    const nodeStream = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    const lines = createInterface({ input: nodeStream.pipe(createGunzip()) });

    for await (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "[" || line === "]" || line === "") {
        continue;
      }
      const jsonText = line.endsWith(",") ? line.slice(0, -1) : line;
      try {
        yield JSON.parse(jsonText) as ScryfallCard;
      } catch {
        // Einzelne kaputte Zeile überspringen, restlichen Stream nicht abbrechen.
      }
    }
  }

  private async runWithConcurrency<T>(
    items: readonly T[],
    limit: number,
    task: (item: T) => Promise<void>,
  ): Promise<void> {
    let index = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await task(current);
      }
    });
    await Promise.all(workers);
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
