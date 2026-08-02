import type { Job } from "bullmq";

import { CatalogImportProvider, type CatalogImportJobPayload } from "./queueCatalogImport";
import { importCardmarketCatalog } from "./providers/cardmarket";
import { importPokemonCatalog } from "./providers/pokemon";
import { importScryfallCatalog } from "./providers/scryfall";
import { importTcgplayerCatalog } from "./providers/tcgplayer";

/**
 * Verarbeitet CATALOG_IMPORT-Jobs (Feature 60 – Catalog Import Queue
 * Integration). Reine Foundation: validiert den Payload und dispatcht an
 * den passenden Provider-Platzhalter (services/catalog/providers/*.ts) –
 * noch KEIN echter Import, keine API-Aufrufe, keine Prisma-Queries,
 * keine Marketplace-Änderungen.
 *
 * Wird direkt in services/jobs/worker.ts registriert (kein Umweg über
 * services/jobs/processors/*, da das Ticket processCatalogImport.ts
 * ausdrücklich in services/catalog/ verortet).
 *
 * Fehlerbehandlung exakt wie im Ticket gefordert: KEIN try/catch. Ein
 * unbekannter Provider wirft eine Exception (siehe `default`-Zweig) –
 * BullMQ markiert den Job dadurch als fehlgeschlagen und übernimmt den
 * Retry (3 Versuche, exponentieller Backoff, Feature-55-Defaults).
 */
export async function processCatalogImport(job: Job): Promise<void> {
  const payload = job.data as CatalogImportJobPayload;

  console.log(
    `[jobs:catalog-import] Started Catalog Import (Job ${job.id}): Provider "${payload.provider}", ` +
      `Spiel ${payload.gameId}${payload.setId ? `, Set ${payload.setId}` : ""}.`,
  );

  if (!payload.gameId) {
    throw new Error("Ungültiger Catalog-Import-Job: gameId fehlt.");
  }

  switch (payload.provider) {
    case CatalogImportProvider.POKEMON:
      await importPokemonCatalog(payload);
      break;
    case CatalogImportProvider.CARDMARKET:
      await importCardmarketCatalog(payload);
      break;
    case CatalogImportProvider.TCGPLAYER:
      await importTcgplayerCatalog(payload);
      break;
    case CatalogImportProvider.SCRYFALL:
      await importScryfallCatalog(payload);
      break;
    default:
      throw new Error(`Unknown Provider: "${payload.provider}"`);
  }

  console.log(`[jobs:catalog-import] Finished Catalog Import (Job ${job.id}).`);
}
