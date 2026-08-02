import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SetPageProps {
  params: Promise<{ code: string }>;
}

// `code` ist nur innerhalb eines Spiels eindeutig (siehe @@unique([gameId, code])
// in prisma/schema.prisma), global über alle Spiele hinweg nicht garantiert.
// Für den aktuellen Datenbestand (nur Pokémon) ist das unkritisch; sollten
// zwei Spiele denselben Set-Code verwenden, liefert findFirst() irgendeinen
// Treffer. Für vollständige Eindeutigkeit müsste die Route perspektivisch um
// den Game-Slug ergänzt werden (z. B. /games/[slug]/sets/[code]).
const getSet = cache(async (code: string) => {
  return prisma.set.findFirst({
    where: { code },
    select: {
      id: true,
      name: true,
      code: true,
      releaseDate: true,
      game: { select: { name: true } },
      _count: { select: { cards: true } },
      cards: {
        select: {
          id: true,
          name: true,
          cardNumber: true,
          rarity: true,
          cardType: true,
          hp: true,
          image: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: SetPageProps): Promise<Metadata> {
  const { code } = await params;
  const set = await getSet(code);

  if (!set) {
    return { title: "Set nicht gefunden – Project Atlas" };
  }

  return { title: `${set.name} – Project Atlas` };
}

export default async function SetPage({ params }: SetPageProps) {
  const { code } = await params;
  const set = await getSet(code);

  if (!set) {
    notFound();
  }

  // Numerisch/natürlich sortieren: cardNumber ist ein String, eine reine
  // String-Sortierung würde "10" vor "2" einordnen.
  const cards = [...set.cards].sort((a, b) =>
    a.cardNumber.localeCompare(b.cardNumber, undefined, { numeric: true }),
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">{set.game.name}</p>
        <h1 className="text-4xl font-bold tracking-tight">{set.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-mono">
            {set.code}
          </Badge>
          <Badge variant="secondary">{formatDate(set.releaseDate)}</Badge>
          <Badge variant="secondary">
            {set._count.cards} {set._count.cards === 1 ? "Karte" : "Karten"}
          </Badge>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.id} href={`/cards/${card.id}`} className="group">
            <Card className="h-full overflow-hidden py-0 transition-shadow group-hover:shadow-md">
              <div className="flex aspect-5/7 items-center justify-center bg-muted">
                {card.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import, siehe services/import/.
                  <img
                    src={card.image}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageOff className="size-6" />
                    <span className="text-xs">Kein Bild</span>
                  </div>
                )}
              </div>

              <CardContent className="space-y-1.5 p-3">
                <p className="line-clamp-1 text-sm font-medium">{card.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  #{card.cardNumber}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {card.rarity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {card.cardType}
                  </Badge>
                  {card.hp !== null && (
                    <Badge variant="outline" className="text-[10px]">
                      {card.hp} HP
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
