import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { getCards } from "@/services/catalog/getCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CatalogSetPageProps {
  params: Promise<{ game: string; set: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CatalogSetPageProps): Promise<Metadata> {
  const { game: gameSlug, set: setCode } = await params;
  const { game, set } = await getCards(gameSlug, setCode);

  if (!game || !set) {
    return { title: "Set nicht gefunden – Project Atlas" };
  }

  return { title: `${set.name} – ${game.name} – Project Atlas` };
}

export default async function CatalogSetPage({ params, searchParams }: CatalogSetPageProps) {
  const { game: gameSlug, set: setCode } = await params;
  const { page: pageParam } = await searchParams;
  const page = pageParam ? Number.parseInt(pageParam, 10) : 1;

  const { game, set, cards, total, pageSize } = await getCards(
    gameSlug,
    setCode,
    Number.isFinite(page) && page > 0 ? page : 1,
  );

  if (!game || !set) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href={`/catalog/${game.slug}`} className="hover:underline">
            {game.name}
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{set.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Code: {set.code}</Badge>
          <Badge variant="secondary">
            {total} {total === 1 ? "Karte" : "Karten"}
          </Badge>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Karten für dieses Set.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cards.map((card) => (
            <Link key={card.id} href={`/catalog/card/${card.id}`}>
              <Card className="h-full overflow-hidden py-0 transition-colors hover:bg-accent/50">
                <div className="flex aspect-[5/7] items-center justify-center bg-muted">
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                    <img
                      src={card.image}
                      alt={card.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-6 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="space-y-0.5 py-3">
                  <p className="truncate text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{card.cardNumber} · {card.rarity}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          {currentPage > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/catalog/${game.slug}/${set.code}?page=${currentPage - 1}`}>
                Zurück
              </Link>
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
              <Link href={`/catalog/${game.slug}/${set.code}?page=${currentPage + 1}`}>
                Weiter
              </Link>
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
