import type { PrismaClient } from "@/prisma/generated/prisma/client";

import { BaseImporter } from "./BaseImporter";
import { LorcanaImporter } from "./LorcanaImporter";
import { MtgImporter } from "./MtgImporter";
import { OnePieceImporter } from "./OnePieceImporter";
import { PokemonImporter } from "./PokemonImporter";
import { YugiohImporter } from "./YugiohImporter";

export { BaseImporter, type ImportResult } from "./BaseImporter";
export { PokemonImporter } from "./PokemonImporter";
export { YugiohImporter } from "./YugiohImporter";
export { MtgImporter } from "./MtgImporter";
export { OnePieceImporter } from "./OnePieceImporter";
export { LorcanaImporter } from "./LorcanaImporter";

/**
 * Registry aller verfügbaren Importer, indiziert nach Game.slug.
 *
 * Ein neues Spiel hinzufügen:
 * 1. Neue Klasse services/import/<Name>Importer.ts anlegen, die BaseImporter
 *    erweitert (gameSlug/gameName setzen, importGames/importSets/importCards
 *    implementieren).
 * 2. Hier importieren und mit dem passenden Game.slug eintragen.
 * Der Rest der Architektur (BaseImporter.run(), Aufrufer dieser Registry)
 * muss dafür nicht angepasst werden.
 */
export const importerRegistry = {
  pokemon: PokemonImporter,
  "yu-gi-oh": YugiohImporter,
  "magic-the-gathering": MtgImporter,
  "one-piece-card-game": OnePieceImporter,
  "disney-lorcana": LorcanaImporter,
} as const satisfies Record<string, new (prisma: PrismaClient) => BaseImporter>;

export type ImporterGameSlug = keyof typeof importerRegistry;
