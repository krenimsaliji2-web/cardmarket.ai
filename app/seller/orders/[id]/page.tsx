import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getSellerOrders } from "@/services/orders/getSellerOrders";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ShipmentForm } from "./shipment-form";

interface SellerOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Bestellung versenden – Project Atlas",
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

export default async function SellerOrderDetailPage({ params }: SellerOrderDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Wiederverwendung der bestehenden getSellerOrders() statt eines neuen
  // Einzel-Order-Service – der Aufrufer sieht ohnehin ausschließlich seine
  // eigenen Bestellungen/Positionen (Ownership bereits dort durchgesetzt).
  const orders = await getSellerOrders(session.user.id);

  if (!orders) {
    redirect("/seller");
  }

  const order = orders.find((entry) => entry.orderId === id);

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Versand verwalten</h1>

      <Card>
        <CardHeader className="flex flex-col gap-1 border-b pb-4">
          <p className="font-mono text-sm font-medium">Bestellung #{order.orderId}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.createdAt)} · {order.itemCount}{" "}
            {order.itemCount === 1 ? "Position" : "Positionen"}
          </p>
          <a
            href={`/invoices/invoice-${order.orderId}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Rechnung herunterladen (PDF)
          </a>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {order.items.map((item) => {
            const isShipped = item.shippedAt !== null;
            const isDelivered = item.deliveredAt !== null;

            return (
              <div key={item.id} className="flex flex-col gap-4 border-b pb-6 last:border-b-0 last:pb-0">
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
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.language}</Badge>
                      <Badge variant="outline">{item.condition}</Badge>
                      <Badge variant="outline">Menge: {item.quantity}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <p className="font-medium">{formatPrice(item.subtotal)}</p>
                    {isDelivered ? (
                      <Badge>Geliefert</Badge>
                    ) : isShipped ? (
                      <Badge variant="secondary">Versendet</Badge>
                    ) : (
                      <Badge variant="outline">Nicht versendet</Badge>
                    )}
                  </div>
                </div>

                <ShipmentForm
                  orderId={order.orderId}
                  orderItemId={item.id}
                  initialCarrier={item.shippingCarrier}
                  initialTrackingNumber={item.trackingNumber}
                  isShipped={isShipped}
                  isDelivered={isDelivered}
                />

                {(item.shippedAt || item.deliveredAt) && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {item.shippingCarrier && (
                      <p>Versanddienst: {CARRIER_LABELS[item.shippingCarrier]}</p>
                    )}
                    {item.shippedAt && <p>Versendet am: {formatDate(item.shippedAt)}</p>}
                    {item.deliveredAt && <p>Geliefert am: {formatDate(item.deliveredAt)}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}
