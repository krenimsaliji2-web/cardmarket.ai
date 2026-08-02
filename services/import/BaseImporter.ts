import type { PrismaClient } from "@/prisma/generated/prisma/client";

/**
 * Ergebnis eines einzelnen Import-Schritts (importGames/importSets/importCards)
 * oder des gesamten Laufs (run()).
 */
export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Basisklasse für alle Trading-Card-Game-Importer.
 *
 * Jeder Importer ist für genau ein Spiel zuständig und importiert entlang
 * der Datenbank-Hierarchie Game -> Set -> Card (siehe prisma/schema.prisma).
 * Die eigentliche Anbindung an externe Datenquellen (offizielle/inoffizielle
 * APIs, Importdateien, ...) erfolgt ausschließlich in den konkreten
 * Importer-Klassen, nicht hier.
 */
export abstract class BaseImporter {
  /** Muss exakt dem Game.slug aus prisma/seed.ts entsprechen. */
  abstract readonly gameSlug: string;

  /** Anzeigename, z. B. für Logs/Admin-UI. */
  abstract readonly gameName: string;

  constructor(protected readonly prisma: PrismaClient) {}

  /** Legt den Game-Datensatz an oder aktualisiert ihn (Game.upsert). */
  abstract importGames(): Promise<ImportResult>;

  /** Importiert alle Sets des Spiels (Set.upsert, verknüpft mit Game). */
  abstract importSets(): Promise<ImportResult>;

  /** Importiert alle Karten des Spiels (Card.upsert, verknüpft mit Set/Game). */
  abstract importCards(): Promise<ImportResult>;

  /**
   * Führt den vollständigen Import in der korrekten Reihenfolge aus
   * (Game vor Set vor Card, da Set/Card per Foreign Key davon abhängen).
   */
  async run(): Promise<ImportResult> {
    const steps = [
      await this.importGames(),
      await this.importSets(),
      await this.importCards(),
    ];

    return steps.reduce<ImportResult>(
      (total, step) => ({
        created: total.created + step.created,
        updated: total.updated + step.updated,
        skipped: total.skipped + step.skipped,
        errors: [...total.errors, ...step.errors],
      }),
      { created: 0, updated: 0, skipped: 0, errors: [] },
    );
  }
}
