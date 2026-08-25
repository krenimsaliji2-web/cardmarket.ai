import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/services/jobs/queue";

/**
 * Infrastruktur-Health-Check für den Docker-Healthcheck (siehe Dockerfile)
 * und externe Monitoring-/Load-Balancer-Probes (Feature 86 – Deployment).
 * Prüft ausschließlich Erreichbarkeit der beiden externen Abhängigkeiten
 * (MariaDB, Redis) – keine Businesslogik, keine Authentifizierung
 * nötig, da hier keine Nutzerdaten zurückgegeben werden.
 *
 * Redis ist für den reinen Seitenbetrieb nicht zwingend erforderlich
 * (siehe README "Redis & Queue" – Timeout-Fallback bei Nichterreichbarkeit),
 * wird hier aber dennoch separat ausgewiesen, damit ein Operator einen
 * ausgefallenen Redis-Container erkennen kann, ohne dass der Healthcheck
 * dafür gleich den ganzen Container als "unhealthy" markiert.
 */
export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const status = database.ok ? "ok" : "error";
  const httpStatus = database.ok ? 200 : 503;

  return NextResponse.json(
    {
      status,
      database,
      redis,
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus },
  );
}

async function checkDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" };
  }
}

async function checkRedis(): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await Promise.race([
      redisConnection.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
    ]);
    return { ok: result === "PONG" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" };
  }
}
