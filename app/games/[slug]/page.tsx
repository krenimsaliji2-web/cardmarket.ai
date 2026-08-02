import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Feature 81 – Multi-TCG-Datenintegration: Sets sind jetzt paginiert statt
 * komplett auf einer Seite gerendert. Bei Pokémon (174 Sets) fiel das noch
 * nicht ins Gewicht, bei Magic (675 Sets) und Yu-Gi-Oh! (639 Sets) hätte die
 * Seite sonst über tausend Bilder auf einmal laden müssen.
 */
const SETS_PAGE_SIZE = 24;

interface GamePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Pro Request nur einmal geladen, auch wenn generateMetadata() und die Page
// beide darauf zugreifen (React cache() dedupliziert innerhalb eines Requests).
const getGame = cache(async (slug: string, page: number) => {
  return prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      _count: { select: { sets: true, cards: true } },
      sets: {
        orderBy: { releaseDate: "desc" },
        skip: (page - 1) * SETS_PAGE_SIZE,
        take: SETS_PAGE_SIZE,
        select: {
          id: true,
          name: true,
          code: true,
          releaseDate: true,
          coverImage: true,
          symbolImage: true,
          _count: { select: { cards: true } },
        },
      },
    },
  });
});

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug, 1);

  if (!game) {
    return { title: "Spiel nicht gefunden – Project Atlas" };
  }

  return { title: `${game.name} – Project Atlas` };
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const game = await getGame(slug, page);

  if (!game) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(game._count.sets / SETS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">{game.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {game._count.sets} {game._count.sets === 1 ? "Set" : "Sets"}
          </Badge>
          <Badge variant="secondary">
            {game._count.cards} {game._count.cards === 1 ? "Karte" : "Karten"}
          </Badge>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {game.sets.map((set) => (
          <Card key={set.id} className="flex flex-col overflow-hidden py-0">
            <div className="flex h-32 items-center justify-center bg-muted">
              {set.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import, siehe services/import/.
                <img
                  src={set.coverImage}
                  alt={`${set.name} Logo`}
                  className="max-h-24 max-w-[80%] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImageOff className="size-8" />
                  <span className="text-xs">Kein Bild</span>
                </div>
              )}
            </div>

            <CardHeader className="flex-1 pt-6">
              <div className="flex items-center gap-2">
                {set.symbolImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import, siehe services/import/.
                  <img src={set.symbolImage} alt="" className="size-5 shrink-0" />
                )}
                <CardTitle className="text-lg">{set.name}</CardTitle>
              </div>
              <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <dt>Code</dt>
                  <dd className="font-mono text-foreground">{set.code}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Release</dt>
                  <dd className="text-foreground">{formatDate(set.releaseDate)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Karten</dt>
                  <dd className="text-foreground">{set._count.cards}</dd>
                </div>
              </dl>
            </CardHeader>

            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/sets/${set.code}`}>Karten ansehen</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/games/${slug}?page=${currentPage - 1}`}>Zurück</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Zurück
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages}
          </p>

          {currentPage < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/games/${slug}?page=${currentPage + 1}`}>Weiter</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Weiter
            </Button>
          )}
        </nav>
      )}
    </main>
  );
}
