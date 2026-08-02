import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { DEFAULT_FAVORITE_CONDITION } from "@/lib/validation/wishlistItem";
import { getCardById } from "@/services/catalog/getCards";
import { getWishlistItemByVariant } from "@/services/wishlist/getWishlistItemByVariant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { FavoriteButton } from "@/app/my-wishlist/favorite-button";

interface CatalogCardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CatalogCardPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    return { title: "Karte nicht gefunden – Project Atlas" };
  }

  return { title: `${card.name} – Project Atlas` };
}

export default async function CatalogCardPage({ params }: CatalogCardPageProps) {
  const { id } = await params;
  const card = await getCardById(id);

  if (!card) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const favoriteVariant = {
    cardId: card.id,
    language: card.language,
    condition: DEFAULT_FAVORITE_CONDITION,
    foil: false,
  };
  const favoriteItem = session
    ? await getWishlistItemByVariant(session.user.id, favoriteVariant)
    : null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
            <img src={card.image} alt={card.name} className="w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 p-16 text-muted-foreground">
              <ImageOff className="size-8" />
              <span className="text-sm">Kein Bild</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <Link href={`/catalog/${card.game.slug}`} className="hover:underline">
                {card.game.name}
              </Link>
              {" · "}
              <Link
                href={`/catalog/${card.game.slug}/${card.set.code}`}
                className="hover:underline"
              >
                {card.set.name}
              </Link>
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{card.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">#{card.cardNumber}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{card.rarity}</Badge>
            <Badge variant="secondary">{card.cardType}</Badge>
            {card.hp !== null && <Badge variant="secondary">{card.hp} HP</Badge>}
            {card.types.map((type) => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}
          </div>

          <FavoriteButton
            cardId={favoriteVariant.cardId}
            language={favoriteVariant.language}
            condition={favoriteVariant.condition}
            foil={favoriteVariant.foil}
            initialFavorited={favoriteItem !== null}
            requiresLogin={!session}
          />

          {card.subtypes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {card.subtypes.join(" · ")}
            </p>
          )}

          {card.artist && (
            <p className="text-sm text-muted-foreground">Illustration: {card.artist}</p>
          )}

          {card.description && (
            <p className="text-sm leading-relaxed text-foreground/90">{card.description}</p>
          )}

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sprache</p>
                <p className="font-medium">{card.language}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Set-Code</p>
                <p className="font-medium">{card.set.code}</p>
              </div>
              {card.evolvesFrom && (
                <div>
                  <p className="text-muted-foreground">Evolves From</p>
                  <p className="font-medium">{card.evolvesFrom}</p>
                </div>
              )}
              {card.supertype && (
                <div>
                  <p className="text-muted-foreground">Supertype</p>
                  <p className="font-medium">{card.supertype}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
