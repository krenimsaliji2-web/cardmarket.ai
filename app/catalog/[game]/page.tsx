import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { getSets } from "@/services/catalog/getSets";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CatalogGamePageProps {
  params: Promise<{ game: string }>;
}

export async function generateMetadata({ params }: CatalogGamePageProps): Promise<Metadata> {
  const { game: gameSlug } = await params;
  const { game } = await getSets(gameSlug);

  if (!game) {
    return { title: "Spiel nicht gefunden – Project Atlas" };
  }

  return { title: `${game.name} – Kartenkatalog – Project Atlas` };
}

export default async function CatalogGamePage({ params }: CatalogGamePageProps) {
  const { game: gameSlug } = await params;
  const { game, sets } = await getSets(gameSlug);

  if (!game) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
          {game.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
            <img src={game.logo} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
          <Badge variant="secondary">
            {sets.length} {sets.length === 1 ? "Set" : "Sets"}
          </Badge>
        </div>
      </div>

      {sets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Sets für dieses Spiel.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Link key={set.id} href={`/catalog/${game.slug}/${set.code}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="flex flex-row items-center gap-2">
                  {set.symbol && (
                    // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                    <img src={set.symbol} alt="" className="size-5 shrink-0" />
                  )}
                  <CardTitle className="text-lg">{set.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-1 text-sm text-muted-foreground">
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
                      <dd className="text-foreground">{set.cardCount}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
