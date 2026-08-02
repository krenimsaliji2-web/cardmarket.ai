import type { Metadata } from "next";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { getGames } from "@/services/catalog/getGames";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Kartenkatalog – Project Atlas",
};

export default async function CatalogPage() {
  const games = await getGames();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Kartenkatalog</h1>
        <p className="text-muted-foreground">
          Zentrale Kartendatenbank aller unterstützten Sammelkartenspiele.
        </p>
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Spiele im Katalog.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} href={`/catalog/${game.slug}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                    {game.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                      <img
                        src={game.logo}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {game.setCount} {game.setCount === 1 ? "Set" : "Sets"}
                  </Badge>
                  <Badge variant="secondary">
                    {game.cardCount} {game.cardCount === 1 ? "Karte" : "Karten"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
