import type { CatalogImportJobPayload } from "../queueCatalogImport";

/**
 * Platzhalter für den künftigen Scryfall-Catalog-Import über die Queue
 * (Feature 60 – reine Foundation). Führt NOCH KEINEN echten Import
 * durch: kein API-Aufruf, kein API-Key, keine Prisma-Query.
 */
export async function importScryfallCatalog(payload: CatalogImportJobPayload): Promise<void> {
  console.log(
    `[jobs:catalog-import:scryfall] Platzhalter – würde importieren: Spiel ${payload.gameId}` +
      `${payload.setId ? `, Set ${payload.setId}` : " (alle Sets)"}.`,
  );
}
