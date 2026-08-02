import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getCart } from "@/services/cart/getCart";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CartItemActions } from "./cart-item-actions";

export const metadata: Metadata = {
  title: "Warenkorb – Project Atlas",
};

export default async function CartPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const cart = await getCart(session.user.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Warenkorb</h1>

      {cart.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Dein Warenkorb ist leer.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                    {item.cardImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
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
                      {!item.isActive && (
                        <Badge variant="destructive">Nicht mehr aktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Verkäufer: {item.sellerName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.subtotal)}
                    </p>
                  </div>

                  <CartItemActions
                    cartItemId={item.id}
                    quantity={item.quantity}
                    maxQuantity={item.availableQuantity}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-lg font-semibold">Gesamtsumme</p>
            <p className="text-2xl font-bold">{formatPrice(cart.totalPrice)}</p>
          </div>

          <Button asChild size="lg">
            <Link href="/checkout">Zur Kasse</Link>
          </Button>
        </>
      )}
    </main>
  );
}
