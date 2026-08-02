import { fileURLToPath } from "node:url";

import { getRegisteredJobs, type SchedulerJobDefinition } from "./jobs";

export interface SchedulerHandle {
  registeredJobs: SchedulerJobDefinition[];
}

/**
 * "Registriert" einen einzelnen Job – validiert seine Definition (wirft
 * ungefangen bei Ungültigkeit, siehe jobs.ts) und loggt ihn. Kein
 * echter Trigger-Mechanismus, keine Cron-Expression, kein setInterval –
 * reine Foundation.
 */
function registerJob(job: SchedulerJobDefinition): void {
  console.log(`[scheduler] Registered Job: ${job.name} – ${job.description}`);
}

/**
 * Führt den Handler eines Jobs GENAU EINMAL aus, falls einer registriert
 * ist (aktuell PRICE_ALERT_SCAN -> queueFullPriceScan() [Feature 65],
 * CATALOG_IMPORT -> queueCatalogImport() [Feature 66], ANALYTICS ->
 * enqueue(JobType.ANALYTICS, ...) [Feature 67], HEALTHCHECK ->
 * enqueue(...HEALTHCHECK..., ...) [Feature 68] und MARKETPLACE ->
 * queueMarketplace() [Feature 69]). Kein try/catch: ein Fehler aus dem
 * Handler propagiert ungefangen (Ticket: "darf Fehler direkt werfen.
 * BullMQ übernimmt Retry."). Kein Polling, keine Endlosschleife, kein
 * setInterval – "nur einmaliger Trigger als Foundation".
 */
async function runJobIfWired(job: SchedulerJobDefinition): Promise<void> {
  if (!job.handler) {
    return;
  }

  await job.handler();

  // Feature 65/67/68 – exakter, ticketvorgegebener Log-Text NUR für Jobs,
  // deren eigener Queue-Aufruf nicht schon selbst diesen Wortlaut loggt.
  // CATALOG_IMPORT und MARKETPLACE brauchen diesen Zusatz-Log NICHT:
  // queueCatalogImport() (Feature 60) loggt bereits selbst "Queued
  // Catalog Import: ...", queueMarketplace() (Feature 64) loggt bereits
  // selbst "Queued Marketplace Job: ...". ANALYTICS und HEALTHCHECK rufen
  // dagegen den generischen enqueue() direkt auf (kein dedizierter
  // Wrapper existiert, siehe jobs.ts) – enqueue() selbst loggt nichts,
  // daher hier der explizite Log.
  if (job.name === "PRICE_ALERT_SCAN") {
    console.log("[scheduler] Queued Full Price Scan.");
  } else if (job.name === "ANALYTICS") {
    console.log("[scheduler] Queued Analytics.");
  } else if (job.name === "HEALTHCHECK") {
    console.log("[scheduler] Queued Healthcheck.");
  }
}

/**
 * Startet den Scheduler: lädt und validiert die Job Registry (jobs.ts),
 * "registriert" jeden Job (Logging) und führt anschließend den Handler
 * jedes real verdrahteten Jobs genau einmal aus (seit Feature 65 –
 * zuvor, Feature 59, gab es noch keine Handler). Löst dabei
 * AUSSCHLIESSLICH bestehende Queue-Einstiege aus (aktuell
 * services/price-alerts/queueFullPriceScan.ts [Feature 58],
 * services/catalog/queueCatalogImport.ts [Feature 60],
 * services/marketplace/queueMarketplace.ts [Feature 64] und der
 * generische enqueue() aus services/jobs/enqueue.ts für ANALYTICS
 * [Feature 67] und HEALTHCHECK [Feature 68]) – keine neue Redis-
 * Connection, kein neuer Worker.
 *
 * Eigenständiger Prozess: keine Integration in Next.js, keine
 * Integration in den bestehenden Worker (services/jobs/worker.ts) –
 * dieser bleibt vollständig unverändert.
 */
export async function startScheduler(): Promise<SchedulerHandle> {
  console.log("[scheduler] Scheduler started.");

  const registeredJobs = getRegisteredJobs();
  for (const job of registeredJobs) {
    registerJob(job);
  }

  console.log(`[scheduler] Registered Jobs: ${registeredJobs.map((job) => job.name).join(", ")}.`);

  for (const job of registeredJobs) {
    await runJobIfWired(job);
  }

  return { registeredJobs };
}

/**
 * Beendet den Scheduler. Da es (noch) keine echten Cron-Expressions/
 * setInterval/Trigger gibt, die laufen könnten, gibt es hier nichts
 * "abzubrechen" – die Funktion existiert für den Start/Stop-Lifecycle,
 * den künftige Features (echte Zeitpläne) erweitern werden.
 */
export function stopScheduler(): void {
  console.log("[scheduler] Scheduler stopped.");
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const enabled = process.env.SCHEDULER_ENABLED === "true";

  if (!enabled) {
    console.log(
      "[scheduler] SCHEDULER_ENABLED ist nicht auf \"true\" gesetzt (Default: false) – Scheduler wird nicht gestartet.",
    );
    // Explizites Beenden nötig (Bugfix, Feature 65): jobs.ts importiert
    // seit diesem Feature queueFullPriceScan(), was transitiv die
    // geteilte Redis-Connection aus services/jobs/queue.ts erzeugt
    // (Modul-Seiteneffekt, siehe dort). Dadurch hält ioredis' interner
    // Reconnect-Timer den Node-Prozess am Leben, selbst wenn der
    // Scheduler nie gestartet wird – ohne diesen expliziten Exit würde
    // der deaktivierte (Standard-)Zustand nie mehr von selbst enden.
    process.exit(0);
  } else {
    // Bewusst kein Top-Level-await: bricht, sobald diese Datei aus einem
    // anderen, CJS-transformierten Kontext heraus dynamisch importiert
    // wird (z. B. `await import(...)` aus einem Testskript) – esbuild
    // erlaubt Top-Level-await nur im ESM-Output. Eine async IIFE ist in
    // jedem Kontext sicher und verhält sich beim direkten Ausführen
    // (`npm run scheduler`) identisch.
    void (async () => {
      await startScheduler();
      // Nur Foundation: keine echten Cron-Expressions, kein setInterval,
      // keine Polling-Loop (siehe Ticket) – nach dem einmaligen Trigger
      // gibt es nichts mehr, worauf der Prozess warten müsste, daher wird
      // sofort wieder sauber gestoppt statt den Prozess künstlich am
      // Leben zu halten.
      stopScheduler();
    })();
  }
}
