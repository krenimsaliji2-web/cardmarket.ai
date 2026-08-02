import { CatalogImportProvider, queueCatalogImport } from "@/services/catalog/queueCatalogImport";
import { enqueue } from "@/services/jobs/enqueue";
import { JobType } from "@/services/jobs/job-types";
import { MarketplaceJobType, queueMarketplace } from "@/services/marketplace/queueMarketplace";
import { queueFullPriceScan } from "@/services/price-alerts/queueFullPriceScan";

/**
 * Job Registry der Scheduler-Foundation (Feature 59, erweitert in
 * Feature 65/66/67). Definiert registrierbare Jobs (Name + Beschreibung)
 * – optional mit einem `handler` für Jobs, die bereits real verdrahtet
 * sind (aktuell PRICE_ALERT_SCAN [Feature 65], CATALOG_IMPORT [Feature
 * 66] und ANALYTICS [Feature 67]). Alle übrigen Jobs bleiben bewusst
 * OHNE Handler – reine Definition, keine automatische Ausführung, keine
 * Kopplung an weitere Queue-Integrationen (Feature 61/62/63/64).
 *
 * Die Namen sind eine EIGENE, unabhängige Namensgebung des Schedulers –
 * kein Re-Export/Alias der BullMQ-Job-Typen aus
 * services/jobs/job-types.ts. "HEALTHCHECK" hat bewusst keinen
 * bestehenden Queue-Bezug.
 *
 * ANALYTICS (Feature 67): Anders als bei PRICE_ALERT_SCAN/CATALOG_IMPORT
 * existiert für Analytics KEIN dedizierter queueAnalytics()-Wrapper
 * (services/jobs/processors/analytics.ts ist weiterhin ein reiner
 * Platzhalter-Processor, siehe Feature 55) – "die bereits vorhandene
 * Queue" ist hier der generische enqueue() aus services/jobs/enqueue.ts
 * selbst. Der Handler ruft daher enqueue(JobType.ANALYTICS, ...) direkt
 * auf, statt eine neue, nicht angeforderte queueAnalytics()-Datei zu
 * erfinden ("keine Analytics-Funktionen neu implementieren", "keine
 * neue Queue").
 *
 * HEALTHCHECK (Feature 68): geht noch einen Schritt weiter als ANALYTICS
 * – es existiert nicht nur kein dedizierter Wrapper, sondern auch KEIN
 * JobType.HEALTHCHECK in services/jobs/job-types.ts. Das Ticket erlaubt
 * ausschließlich Änderungen an services/scheduler/{jobs,scheduler}.ts
 * ("Keine Änderungen an: Queue") – job-types.ts (Teil der Queue
 * Foundation, Feature 55) darf daher NICHT um einen neuen Jobtyp
 * erweitert werden. Um trotzdem ausschließlich den bestehenden
 * generischen enqueue()-Einstieg zu nutzen (keine neue Queue, keine neue
 * Datei), wird der Jobname als Literal per Type-Cast übergeben – exakt
 * dasselbe Cast-Muster (`as unknown as X`), das jede Domain-queueX.ts
 * bereits für ihre Payloads verwendet (`payload as unknown as
 * JobPayload`). Laufzeitverhalten ist unverändert: JobType ist zur
 * Laufzeit nur ein String: BullMQ erhält den echten Jobnamen
 * "HEALTHCHECK". Da dafür (bewusst, siehe Ticket) kein Worker-Processor
 * verdrahtet wird, würde eine tatsächliche Verarbeitung mit einer
 * klaren Fehlermeldung fehlschlagen statt fälschlich einen anderen
 * Jobtyp zu verarbeiten – das ist hier explizit in Kauf genommen.
 *
 * MARKETPLACE (Feature 69): anders als ANALYTICS/HEALTHCHECK existiert
 * hier ein echter dedizierter Wrapper – queueMarketplace() (Feature 64,
 * services/marketplace/queueMarketplace.ts) –, der NICHT verändert werden
 * darf. Dessen Payload (`listingId`/`type`) ist Pflicht, daher – exakt
 * wie bei CATALOG_IMPORT (Feature 66) – ein deutlich erkennbarer
 * Platzhalter-Payload, keine Datenbankabfrage nach einem "echten" Listing
 * (wäre zusätzliche Logik). `sendNotification`/`sendEmail` bleiben
 * bewusst weg (Default: kein Notification-/E-Mail-Versand durch den
 * Scheduler-Trigger). queueMarketplace() loggt bereits selbst "Queued
 * Marketplace Job: ..." (enthält den ticketvorgegebenen Text "Queued
 * Marketplace") – daher, wie bei CATALOG_IMPORT, KEIN zusätzlicher
 * Sonderfall-Log in scheduler.ts nötig.
 */
export const SchedulerJob = {
  /** Feature 65 – vormals "PRICE_SCAN" (Platzhalter aus Feature 59), jetzt real verdrahtet. */
  PRICE_ALERT_SCAN: "PRICE_ALERT_SCAN",
  CATALOG_IMPORT: "CATALOG_IMPORT",
  ANALYTICS: "ANALYTICS",
  HEALTHCHECK: "HEALTHCHECK",
  MARKETPLACE: "MARKETPLACE",
} as const;

export type SchedulerJob = (typeof SchedulerJob)[keyof typeof SchedulerJob];

export interface SchedulerJobDefinition {
  name: SchedulerJob;
  description: string;
  /**
   * Optional: wird von startScheduler() beim Start GENAU EINMAL
   * aufgerufen (siehe scheduler.ts) – nur für real verdrahtete Jobs
   * gesetzt. Kein try/catch um den Aufruf: ein Fehler aus dem Handler
   * (z. B. queueFullPriceScan()) propagiert ungefangen, BullMQ
   * übernimmt den Retry auf Queue-Ebene (Feature-55-Defaults).
   */
  handler?: () => Promise<unknown>;
}

/**
 * Statische Liste aller registrierbaren Jobs. Rein deklarativ – keine
 * echten Cron-Ausdrücke, keine Zeitpläne, kein Polling. PRICE_ALERT_SCAN
 * ruft laut Ticket AUSSCHLIESSLICH die bestehende
 * services/price-alerts/queueFullPriceScan.ts (Feature 58) auf, keine
 * eigene Price-Alert-/Datenbanklogik. CATALOG_IMPORT ruft laut Ticket
 * AUSSCHLIESSLICH die bestehende services/catalog/queueCatalogImport.ts
 * (Feature 60) auf – "keine zusätzliche Logik", außer der für den aktuell
 * verpflichtenden Payload notwendigen (`provider`/`gameId`, siehe
 * queueCatalogImport()'s Signatur, die nicht verändert werden darf).
 * `gameId` ist dabei bewusst ein deutlich erkennbarer Platzhalter (keine
 * Datenbankabfrage nach einer "echten" Game-ID – das wäre bereits
 * zusätzliche Logik/ein DB-Zugriff, den dieses reine Foundation-Feature
 * laut Ticket nicht haben soll); ein künftiges Feature, das echte
 * geplante Importe umsetzt, ersetzt diesen Platzhalter durch eine
 * echte Konfiguration/Auswahl.
 */
export const schedulerJobRegistry: SchedulerJobDefinition[] = [
  {
    name: SchedulerJob.PRICE_ALERT_SCAN,
    description: "Startet einen vollständigen Price-Alert-Scan.",
    handler: queueFullPriceScan,
  },
  {
    name: SchedulerJob.CATALOG_IMPORT,
    description: "Startet einen vollständigen Katalogimport.",
    handler: () =>
      queueCatalogImport({
        provider: CatalogImportProvider.POKEMON,
        gameId: "scheduler-full-catalog-import",
        fullImport: true,
      }),
  },
  {
    name: SchedulerJob.ANALYTICS,
    description: "Startet einen vollständigen Analytics-Lauf.",
    handler: () => enqueue(JobType.ANALYTICS, {}),
  },
  {
    name: SchedulerJob.HEALTHCHECK,
    description: "Startet einen vollständigen System-Healthcheck.",
    // Kein JobType.HEALTHCHECK vorhanden (siehe Doc-Kommentar oben) – Cast
    // auf den bestehenden Jobnamen, keine Erweiterung der Queue Foundation.
    handler: () => enqueue(SchedulerJob.HEALTHCHECK as unknown as JobType, {}),
  },
  {
    name: SchedulerJob.MARKETPLACE,
    description: "Startet einen vollständigen Marketplace-Background-Run.",
    handler: () =>
      queueMarketplace({
        listingId: "scheduler-full-marketplace-run",
        type: MarketplaceJobType.LISTING_UPDATED,
      }),
  },
];

/**
 * Validiert eine einzelne Jobdefinition. Wirft ungefangen (siehe Ticket
 * "Ungültige Jobdefinition: Exception. Kein try/catch.") – ein Aufrufer
 * (scheduler.ts) lässt diesen Fehler bewusst durchreichen.
 */
export function validateJobDefinition(job: SchedulerJobDefinition): void {
  if (!job.name || typeof job.name !== "string") {
    throw new Error(`Ungültige Jobdefinition: name fehlt oder ist ungültig (${JSON.stringify(job)}).`);
  }
  if (!job.description || typeof job.description !== "string") {
    throw new Error(`Ungültige Jobdefinition: description fehlt oder ist ungültig (${JSON.stringify(job)}).`);
  }
}

/** Liefert alle registrierten Jobs, nachdem jede Definition validiert wurde. */
export function getRegisteredJobs(): SchedulerJobDefinition[] {
  for (const job of schedulerJobRegistry) {
    validateJobDefinition(job);
  }
  return schedulerJobRegistry;
}
