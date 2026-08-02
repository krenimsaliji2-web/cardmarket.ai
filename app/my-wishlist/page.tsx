import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getWishlist } from "@/services/wishlist/getWishlist";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { WishlistItemForm } from "./wishlist-item-form";

export const metadata: Metadata = {
  title: "Meine Wunschliste – Project Atlas",
};

export default async function MyWishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const wishlist = await getWishlist(session.user.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Meine Wunschliste</h1>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gesamtanzahl
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{wishlist.totalCount}</p>
        </CardContent>
      </Card>

      {wishlist.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Deine Wunschliste ist noch leer.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {wishlist.items.map((item) => {
            const difference = item.priceDifference !== null ? Number(item.priceDifference) : null;
            return (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                      {item.cardImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                        <img
                          src={item.cardImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageOff className="size-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.cardName}</p>
                        {item.foil && <Badge variant="secondary">Foil</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.setName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.language} · {item.condition}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-foreground/90">{item.notes}</p>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p>
                        Marktpreis:{" "}
                        {item.currentMarketPrice !== null
                          ? formatPrice(item.currentMarketPrice)
                          : "–"}
                      </p>
                      <p>
                        Zielpreis:{" "}
                        {item.targetPrice !== null ? formatPrice(item.targetPrice) : "–"}
                      </p>
                      {difference !== null && (
                        <p
                          className={
                            difference <= 0
                              ? "font-medium text-emerald-600"
                              : "font-medium text-destructive"
                          }
                        >
                          Differenz: {difference >= 0 ? "+" : ""}
                          {formatPrice(item.priceDifference!)}
                        </p>
                      )}
                    </div>
                  </div>

                  <WishlistItemForm
                    itemId={item.id}
                    language={item.language}
                    condition={item.condition}
                    foil={item.foil}
                    targetPrice={item.targetPrice}
                    notes={item.notes}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
