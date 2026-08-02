import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { calculateCollectionValue } from "@/services/collection/calculateCollectionValue";
import { getCollection } from "@/services/collection/getCollection";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CollectionItemForm } from "./collection-item-form";

export const metadata: Metadata = {
  title: "Meine Sammlung – Project Atlas",
};

export default async function MyCollectionPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [collection, value] = await Promise.all([
    getCollection(session.user.id),
    calculateCollectionValue(session.user.id),
  ]);

  const valueByItemId = new Map(value.items.map((item) => [item.collectionItemId, item]));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Meine Sammlung</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtwert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{formatPrice(value.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anzahl Karten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{value.totalCardCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unterschiedliche Karten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{value.uniqueCardCount}</p>
          </CardContent>
        </Card>
      </section>

      {collection.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Deine Sammlung ist noch leer.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {collection.items.map((item) => {
            const itemValue = valueByItemId.get(item.id);
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
                        {item.language} · {item.condition} · Menge: {item.quantity}
                      </p>
                    </div>

                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p>
                        Marktwert: {itemValue?.marketPrice ? formatPrice(itemValue.marketPrice) : "–"}
                      </p>
                      <p className="font-medium text-foreground">
                        Gesamt: {formatPrice(itemValue?.totalValue ?? "0.00")}
                      </p>
                    </div>
                  </div>

                  <CollectionItemForm
                    itemId={item.id}
                    quantity={item.quantity}
                    language={item.language}
                    condition={item.condition}
                    foil={item.foil}
                    purchasePrice={item.purchasePrice}
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
