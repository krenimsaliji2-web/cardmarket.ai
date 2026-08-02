import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getTriggeredAlerts } from "@/services/price-alerts/getTriggeredAlerts";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Meine Preisalarme – Project Atlas",
};

export default async function MyPriceAlertsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const alerts = await getTriggeredAlerts(session.user.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Meine Preisalarme</h1>
        <p className="text-muted-foreground">
          Wunschlisten-Karten, deren aktueller Marktpreis dein Zielpreis erreicht oder unterschritten hat.
        </p>
      </div>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ausgelöste Alarme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">{alerts.length}</p>
        </CardContent>
      </Card>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aktuell keine ausgelösten Preisalarme. Setze Zielpreise auf{" "}
          <span className="font-medium">/my-wishlist</span>, um benachrichtigt zu werden, sobald eine
          Karte günstig genug wird.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <Card key={alert.wishlistItemId}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                  {alert.cardImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                    <img
                      src={alert.cardImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{alert.cardName}</p>
                    {alert.foil && <Badge variant="secondary">Foil</Badge>}
                    <Badge variant="default">Zielpreis erreicht</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.setName}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.language} · {alert.condition}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground sm:text-right">
                  <p>Marktpreis: {formatPrice(alert.currentPrice)}</p>
                  <p>Zielpreis: {formatPrice(alert.targetPrice)}</p>
                </div>

                <div className="text-sm sm:text-right">
                  <p className="font-medium text-emerald-600">
                    Ersparnis: {formatPrice(alert.difference)}
                  </p>
                  <p className="text-emerald-600">{alert.percentBelowTarget} % unter Zielpreis</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
