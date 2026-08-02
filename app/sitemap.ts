import type { MetadataRoute } from "next";

/**
 * Feature 79 – Release Readiness: sitemap.xml fehlte komplett. Bewusst auf
 * die stabilen, öffentlichen Top-Level-Seiten beschränkt (kein dynamisches
 * Auflisten aller Karten/Listings/Sets) – ein vollständiger, paginierter
 * Katalog-Sitemap wäre ein eigenständiges Feature mit eigenen
 * Performance-/Chunking-Anforderungen, kein Bestandteil dieses Audits
 * ("NICHTS neu erfinden", "keine Performance-Regression"). Games/Sets
 * ändern sich selten genug, um sie hier ergänzend live zu laden (eine
 * einzige, leichte Query, kein N+1).
 *
 * Feature 86 – Deployment: ohne diese Zeile rendert Next.js diese Route
 * beim `next build` einmalig statisch vor – das erfordert eine zur
 * Build-Zeit erreichbare Datenbank. In einem Docker-Multi-Stage-Build
 * läuft `next build` aber im Builder-Stage ohne Netzwerkzugriff auf den
 * erst zur Laufzeit gestarteten Postgres-Container, wodurch der Build
 * fehlschlagen würde. `force-dynamic` macht diese Route konsistent mit
 * praktisch allen anderen Routen der App (bereits dynamisch wegen
 * `headers()` im Root-Layout, siehe components/layout/site-header.tsx)
 * und liefert nebenbei stets aktuelle Daten statt eines beim Build
 * eingefrorenen Standes.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/marketplace`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/catalog`, changeFrequency: "daily", priority: 0.7 },
  ];

  const { prisma } = await import("@/lib/prisma");
  const games = await prisma.game.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${baseUrl}/games/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...gameRoutes];
}
