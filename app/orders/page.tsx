import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getOrders } from "@/services/orders/getOrders";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Meine Bestellungen – Project Atlas",
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const orders = await getOrders(session.user.id);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Meine Bestellungen</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Du hast noch keine Bestellungen.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-medium">Bestellung #{order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "Position" : "Positionen"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/70">
                    Stripe Checkout ID: {order.stripeCheckoutSessionId}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-lg font-semibold">{formatPrice(order.totalPrice)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{order.paymentStatus}</Badge>
                    <Badge variant="secondary">{order.orderStatus}</Badge>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/orders/${order.id}`}>Details ansehen</Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 border-b pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center"
                  >
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
                      <p className="font-medium">{item.cardName}</p>
                      <p className="text-sm text-muted-foreground">
                        Verkäufer: {item.sellerName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.language}</Badge>
                        <Badge variant="outline">{item.condition}</Badge>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p>
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                      <p className="font-medium text-foreground">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
