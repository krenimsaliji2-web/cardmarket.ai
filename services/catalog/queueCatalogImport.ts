import { enqueue } from "@/services/jobs/enqueue";
import { JobPriority, JobType, type JobPayload } from "@/services/jobs/job-types";

/** Unterstützte Katalog-Provider (Foundation, siehe services/catalog/providers/). */
export const CatalogImportProvider = {
  POKEMON: "POKEMON",
  CARDMARKET: "CARDMARKET",
  TCGPLAYER: "TCGPLAYER",
  SCRYFALL: "SCRYFALL",
} as const;

export type CatalogImportProvider = (typeof CatalogImportProvider)[keyof typeof CatalogImportProvider];

/**
 * Payload für CATALOG_IMPORT-Jobs (Feature 60 – Catalog Import Queue
 * Integration). Bewusst HIER in services/catalog/ definiert statt in
 * services/jobs/job-types.ts – dieselbe Begründung wie bei
 * services/email/queueEmail.ts (Feature 56), services/notifications/
 * queueNotification.ts (Feature 57) und services/price-alerts/
 * queuePriceAlertCheck.ts (Feature 58): die generische Queue-
 * Infrastruktur (Feature 55) soll domänen-unabhängig bleiben.
 *
 * `setId`/`force`/`fullImport` sind optional – ihre konkrete Bedeutung
 * (z. B. "force = bereits importierte Sets erneut abrufen") ist Sache
 * eines künftigen Features, das die Provider-Platzhalter durch echte
 * Importlogik ersetzt (siehe services/catalog/providers/*.ts).
 */
export interface CatalogImportJobPayload {
  provider: CatalogImportProvider;
  gameId: string;
  setId?: string;
  force?: boolean;
  fullImport?: boolean;
}

/**
 * Reiht einen Katalog-Import über die bestehende Queue (Feature 55) ein.
 * Reine Foundation: es wird NICHTS importiert, kein Provider tatsächlich
 * aufgerufen (siehe processCatalogImport.ts) – nur der Job wird angelegt.
 *
 * Priority ist laut Ticket immer LOW. Retry: Feature-55-Defaults (3
 * Versuche, exponentieller Backoff) – keine Sonderkonfiguration nötig.
 *
 * Wird aktuell von KEINEM Feature automatisch aufgerufen ("Scheduler
 * wird NICHT angepasst" laut Ticket) – ein künftiger Scheduler soll
 * diese Funktion später aufrufen.
 */
export async function queueCatalogImport(payload: CatalogImportJobPayload): Promise<string> {
  console.log(
    `[jobs:catalog-import] Queued Catalog Import: Provider "${payload.provider}", Spiel ${payload.gameId}` +
      `${payload.setId ? `, Set ${payload.setId}` : ""}` +
      `${payload.force ? ", force=true" : ""}` +
      `${payload.fullImport ? ", fullImport=true" : ""} (Priorität LOW).`,
  );

  return enqueue(JobType.CATALOG_IMPORT, payload as unknown as JobPayload, { priority: JobPriority.LOW });
}
