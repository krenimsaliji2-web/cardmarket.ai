import type { GameModel } from "@/prisma/generated/prisma/models";
import { slugify } from "@/utils/slugify";

import { BaseImporter, type ImportResult } from "./BaseImporter";

const YGOPRODECK_API_BASE_URL = "https://db.ygoprodeck.com/api/v7";

/** Kleine Pause zwischen Set-Requests – die API ist kostenlos/ohne Key, kein aggressives Polling. */
const REQUEST_DELAY_MS = 150;

const FALLBACK_RARITY = "Common";
/** Die YGOPRODeck-API liefert keine Künstlerangabe. */
const FALLBACK_ARTIST = "Unbekannt";
/**
 * 2 von 1028 Sets liefern kein `tcg_date` (sehr alte/undokumentierte
 * Promo-Ausgaben). `releaseDate` ist in unserem Schema Pflicht – Fallback
 * auf den frühestmöglichen TCG-Release, damit diese Sets nicht übersprungen
 * werden müssen, aber klar als "unbekannt" erkennbar bleiben (weit vor
 * jedem echten Set einsortiert statt ein plausibles Datum zu erfinden).
 */
const FALLBACK_RELEASE_DATE = new Date("2000-01-01");

interface YgoSet {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date?: string;
  set_image?: string;
}

interface YgoCardSetEntry {
  set_name: string;
  set_code: string;
  set_rarity?: string;
}

interface YgoCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  race?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
  typeline?: string[];
  card_sets?: YgoCardSetEntry[];
  card_images: { image_url: string; image_url_small: string }[];
}

interface YgoCardsResponse {
  data: YgoCard[];
}

/**
 * Importer für Yu-Gi-Oh!.
 *
 * Datenquelle: YGOPRODeck API (https://db.ygoprodeck.com/api-guide/), frei
 * nutzbar ohne API-Key. Besonderheit gegenüber der Pokémon-API: Karten sind
 * nicht direkt einem einzelnen Set zugeordnet, sondern führen selbst eine
 * Liste `card_sets` aller Set-Erscheinungen (mit set-spezifischer
 * Kartennummer/Seltenheit). Deshalb wird pro Set gezielt über
 * `cardinfo.php?cardset=<name>` abgefragt und die passende `card_sets`-
 * Zeile (exakter Set-Name-Treffer) für Kartennummer/Rarity herangezogen.
 *
 * Weitere Quelleneigenheit: 142 von 1028 Sets teilen sich einen `set_code`
 * mit weiteren Sonderausgaben (Sneak-Peek-/Sweepstakes-/Special-Edition-
 * Varianten desselben Produkts, z. B. "Absolute Powerforce" und "Absolute
 * Powerforce Sneak Peek Participation Card" beide unter Code "ABPF"). Da
 * `code` in unserem Schema je Spiel eindeutig sein muss, wird pro Code nur
 * die zuerst gelistete Ausgabe als eigener Set-Datensatz angelegt; die
 * übrigen Namens-Varianten werden beim Set-Import übersprungen (siehe
 * ImportResult.skipped), ihre Karten aber trotzdem importiert (sie landen
 * unter demselben Set-Code).
 */
export class YugiohImporter extends BaseImporter {
  readonly gameSlug = "yu-gi-oh";
  readonly gameName = "Yu-Gi-Oh!";

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

  /** Importiert alle Sets (upsert nach Code, keine Duplikate – siehe Klassendoku zu Namens-Varianten). */
  async importSets(): Promise<ImportResult> {
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    let game: GameModel;
    try {
      ({ game } = await this.getOrCreateGame());
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Game-Lookup"));
      return result;
    }

    let apiSets: YgoSet[];
    try {
      apiSets = await this.fetchAllSets();
    } catch (error) {
      result.errors.push(this.toErrorMessage(error, "Abruf der Sets von der YGOPRODeck-API"));
      return result;
    }

    const seenCodes = new Set<string>();

    for (const apiSet of apiSets) {
      if (seenCodes.has(apiSet.set_code)) {
        result.skipped += 1;
        continue;
      }
      seenCodes.add(apiSet.set_code);

      try {
        const symbolImage = apiSet.set_image ?? (await this.fetchFallbackSetImage(apiSet.set_name));
        if (!symbolImage) {
          result.errors.push(`Set "${apiSet.set_name}" (${apiSet.set_code}): kein Bild verfügbar, übersprungen.`);
          continue;
        }

        const existing = await this.prisma.set.findUnique({
          where: { gameId_code: { gameId: game.id, code: apiSet.set_code } },
          select: { id: true },
        });

        const data = {
          name: apiSet.set_name,
          slug: slugify(apiSet.set_name),
          releaseDate: this.parseReleaseDate(apiSet.tcg_date),
          totalCards: apiSet.num_of_cards,
          symbolImage,
          coverImage: apiSet.set_image ?? symbolImage,
        };

        await this.prisma.set.upsert({
          where: { gameId_code: { gameId: game.id, code: apiSet.set_code } },
          update: data,
          create: { gameId: game.id, code: apiSet.set_code, ...data },
        });

        result[existing ? "updated" : "created"] += 1;
      } catch (error) {
        result.errors.push(this.toErrorMessage(error, `Set "${apiSet.set_name}" (${apiSet.set_code})`));
      }
    }

    return result;
  }

  /**
   * Importiert Karten für alle lokal vorhandenen Sets. Pro Set wird
   * `cardinfo.php?cardset=<name>` abgefragt (liefert alle Karten dieses
   * Sets samt vollständiger `card_sets`-Liste je Karte).
   */
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
      let apiCards: YgoCard[];
      try {
        apiCards = await this.fetchCardsForSet(set.name);
      } catch (error) {
        result.errors.push(this.toErrorMessage(error, `Abruf der Karten für Set "${set.name}"`));
        continue;
      }

      const seenCardNumbers = new Set<string>();

      for (const apiCard of apiCards) {
        const setEntry = apiCard.card_sets?.find((entry) => entry.set_name === set.name);
        if (!setEntry) {
          continue;
        }
        if (seenCardNumbers.has(setEntry.set_code)) {
          // Dieselbe Kartennummer im selben Set mit einer weiteren Rarity-Variante – erste behalten.
          result.skipped += 1;
          continue;
        }
        seenCardNumbers.add(setEntry.set_code);

        const image = apiCard.card_images[0]?.image_url ?? apiCard.card_images[0]?.image_url_small;
        if (!image) {
          result.errors.push(`Karte "${apiCard.name}" (${apiCard.id}): kein Bild verfügbar, übersprungen.`);
          continue;
        }

        try {
          const existing = await this.prisma.card.findUnique({
            where: {
              setId_cardNumber_language: {
                setId: set.id,
                cardNumber: setEntry.set_code,
                language: "EN",
              },
            },
            select: { id: true },
          });

          const data = {
            gameId: game.id,
            setId: set.id,
            name: apiCard.name,
            cardNumber: setEntry.set_code,
            rarity: setEntry.set_rarity ?? FALLBACK_RARITY,
            language: "EN",
            image,
            artist: FALLBACK_ARTIST,
            cardType: apiCard.type,
            description: apiCard.desc,
            supertype: this.deriveSupertype(apiCard.type),
            types: apiCard.typeline ?? (apiCard.race ? [apiCard.race] : []),
            subtypes: [] as string[],
            attributes: {
              atk: apiCard.atk ?? null,
              def: apiCard.def ?? null,
              level: apiCard.level ?? null,
              attribute: apiCard.attribute ?? null,
              archetype: apiCard.archetype ?? null,
            },
          };

          await this.prisma.card.upsert({
            where: {
              setId_cardNumber_language: {
                setId: set.id,
                cardNumber: setEntry.set_code,
                language: "EN",
              },
            },
            update: data,
            create: data,
          });

          result[existing ? "updated" : "created"] += 1;
        } catch (error) {
          result.errors.push(this.toErrorMessage(error, `Karte "${apiCard.name}" (${apiCard.id})`));
        }
      }

      await this.delay();
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

  private async fetchAllSets(): Promise<YgoSet[]> {
    const response = await fetch(`${YGOPRODECK_API_BASE_URL}/cardsets.php`);
    if (!response.ok) {
      throw new Error(`YGOPRODeck API antwortete mit ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as YgoSet[];
  }

  private async fetchCardsForSet(setName: string): Promise<YgoCard[]> {
    const url = new URL(`${YGOPRODECK_API_BASE_URL}/cardinfo.php`);
    url.searchParams.set("cardset", setName);

    const response = await fetch(url);
    if (response.status === 400) {
      // Die API antwortet mit 400, wenn ein Set (nach URL-Encoding) keine Treffer hat.
      return [];
    }
    if (!response.ok) {
      throw new Error(`YGOPRODeck API antwortete mit ${response.status} ${response.statusText}`);
    }
    const body = (await response.json()) as YgoCardsResponse;
    return body.data;
  }

  /** Für Sets ohne `set_image`: Bild der ersten Karte dieses Sets als Ersatz verwenden. */
  private async fetchFallbackSetImage(setName: string): Promise<string | null> {
    try {
      const cards = await this.fetchCardsForSet(setName);
      return cards[0]?.card_images[0]?.image_url_small ?? null;
    } catch {
      return null;
    }
  }

  /** Grobe Kategorie für das generische `supertype`-Feld (siehe Card-Schema-Kommentar). */
  private deriveSupertype(type: string): string {
    if (type.includes("Monster")) return "Monster";
    if (type.includes("Spell")) return "Spell";
    if (type.includes("Trap")) return "Trap";
    return type;
  }

  private parseReleaseDate(value: string | undefined): Date {
    if (!value) {
      return FALLBACK_RELEASE_DATE;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? FALLBACK_RELEASE_DATE : date;
  }

  private async delay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  private toErrorMessage(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : "unbekannter Fehler";
    return `${context}: ${message}`;
  }
}
