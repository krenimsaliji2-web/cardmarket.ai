import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Zeigt immer den aktuellen Datenbankstand (Set-/Kartenanzahl), kein
// statischer Build-Snapshot.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project Atlas – Der Trading-Card-Marktplatz",
  description:
    "Entdecke Pokémon, Yu-Gi-Oh!, Magic: The Gathering, One Piece Card Game und Disney Lorcana an einem Ort.",
};

async function getGames() {
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      _count: { select: { sets: true, cards: true } },
    },
  });
}

export default async function Home() {
  const games = await getGames();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Project Atlas
          </h1>
          <p className="text-balance text-muted-foreground sm:text-lg">
            Der KI-gestützte Marktplatz für Trading Cards – Pokémon, Yu-Gi-Oh!,
            Magic: The Gathering, One Piece Card Game und Disney Lorcana.
          </p>
        </div>

        <div className="relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Karten, Sets oder Spiele durchsuchen…"
            className="h-14 rounded-full pl-12 text-base shadow-sm"
            aria-label="Marktplatz durchsuchen"
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Unterstützte Spiele
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const hasCards = game._count.cards > 0;

            return (
              <Card key={game.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {game.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Logo-URLs kommen aus externen Import-Quellen (siehe services/import/).
                      <img
                        src={game.logo}
                        alt={`${game.name} Logo`}
                        className="size-10 shrink-0 object-contain"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                        {game.name.charAt(0)}
                      </div>
                    )}
                    <CardTitle className="text-xl">{game.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {hasCards
                      ? "Karten aus der Datenbank verfügbar"
                      : "Kartendaten folgen in Kürze"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {game._count.sets} {game._count.sets === 1 ? "Set" : "Sets"}
                  </Badge>
                  {hasCards ? (
                    <Badge variant="secondary">
                      {game._count.cards}{" "}
                      {game._count.cards === 1 ? "Karte" : "Karten"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Bald verfügbar</Badge>
                  )}
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/games/${game.slug}`}>Durchsuchen</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
