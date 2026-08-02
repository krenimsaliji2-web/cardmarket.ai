import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getOrder } from "@/services/orders/getOrder";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Bestellung – Project Atlas",
};

const CARRIER_LABELS: Record<string, string> = {
  SWISS_POST: "Swiss Post",
  DHL: "DHL",
  UPS: "UPS",
  FEDEX: "FedEx",
  DPD: "DPD",
  GLS: "GLS",
  OTHER: "Andere",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const order = await getOrder(id, session.user.id);

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Bestellung</h1>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-sm font-medium">Bestellnummer #{order.id}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)} · {order.itemCount}{" "}
              {order.itemCount === 1 ? "Position" : "Positionen"}
            </p>
            <p className="font-mono text-xs text-muted-foreground/70">
              Stripe Checkout Session ID: {order.stripeCheckoutSessionId}
            </p>
            <a
              href={`/invoices/invoice-${order.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              Rechnung herunterladen (PDF)
            </a>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-lg font-semibold">{formatPrice(order.totalPrice)}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{order.paymentStatus}</Badge>
              <Badge variant="secondary">{order.orderStatus}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 border-b pb-4 last:border-b-0 last:pb-0"
            >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                {item.cardImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                  <img src={item.cardImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{item.cardName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.gameName} · {item.setName}
                </p>
                <p className="text-sm text-muted-foreground">Verkäufer: {item.sellerName}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.language}</Badge>
                  <Badge variant="outline">{item.condition}</Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground sm:text-right">
                <p>
                  {formatPrice(item.price)} × {item.quantity}
                </p>
                <p className="font-medium text-foreground">{formatPrice(item.subtotal)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              {item.deliveredAt ? (
                <Badge>Geliefert</Badge>
              ) : item.shippedAt ? (
                <Badge variant="secondary">Versendet</Badge>
              ) : (
                <Badge variant="outline">Noch nicht versendet</Badge>
              )}

              {item.shippingCarrier && (
                <span className="text-muted-foreground">{CARRIER_LABELS[item.shippingCarrier]}</span>
              )}

              {item.trackingNumber && (
                <span className="font-mono text-xs text-muted-foreground">
                  Trackingnummer: {item.trackingNumber}
                </span>
              )}

              {item.trackingUrl && (
                <a
                  href={item.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sendung verfolgen
                </a>
              )}

              {item.deliveredAt && (
                <span className="text-muted-foreground">
                  Geliefert am {formatDate(item.deliveredAt)}
                </span>
              )}
            </div>
          </div>
          ))}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-lg font-semibold">Bestellsumme</p>
            <p className="text-2xl font-bold">{formatPrice(order.totalPrice)}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
