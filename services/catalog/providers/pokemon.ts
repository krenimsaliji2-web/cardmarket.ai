import type { CatalogImportJobPayload } from "../queueCatalogImport";

/**
 * Platzhalter für den künftigen Pokémon-Catalog-Import über die Queue
 * (Feature 60 – reine Foundation). Führt NOCH KEINEN echten Import
 * durch: kein API-Aufruf, kein API-Key, keine Prisma-Query (siehe
 * Ticket "Noch keinerlei API-Aufrufe"). Der bestehende, synchrone
 * Pokémon-Import (services/import/pokemon/*, Feature 38) bleibt
 * vollständig unverändert und unabhängig von diesem Platzhalter.
 */
export async function importPokemonCatalog(payload: CatalogImportJobPayload): Promise<void> {
  console.log(
    `[jobs:catalog-import:pokemon] Platzhalter – würde importieren: Spiel ${payload.gameId}` +
      `${payload.setId ? `, Set ${payload.setId}` : " (alle Sets)"}.`,
  );
}
