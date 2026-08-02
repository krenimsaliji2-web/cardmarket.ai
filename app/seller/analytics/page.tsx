import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getSellerAnalytics } from "@/services/analytics/getSellerAnalytics";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verkäufer-Analytics – Project Atlas",
};

export default async function SellerAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const analytics = await getSellerAnalytics(session.user.id);

  if (!analytics) {
    redirect("/seller");
  }

  const { stats, charts, topCardsByRevenue, topCardsBySales, topSetsByRevenue, topSetsBySales, recentSales } =
    analytics;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Verkäufer-Analytics</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gesamtumsatz" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Gesamtverkäufe" value={String(stats.totalSales)} />
        <StatCard label="Ø Bestellwert" value={formatPrice(stats.averageOrderValue)} />
        <StatCard label="Verkaufte Karten" value={String(stats.totalCardsSold)} />
        <StatCard label="Ø Kartenpreis" value={formatPrice(stats.averageCardPrice)} />
        <StatCard label="Umsatz heute" value={formatPrice(stats.revenueToday)} />
        <StatCard label="Umsatz diese Woche" value={formatPrice(stats.revenueThisWeek)} />
        <StatCard label="Umsatz diesen Monat" value={formatPrice(stats.revenueThisMonth)} />
        <StatCard label="Umsatz dieses Jahr" value={formatPrice(stats.revenueThisYear)} />
        <StatCard
          label="Bestverkaufte Karte"
          value={stats.bestSellingCard ? `${stats.bestSellingCard.cardName} (${stats.bestSellingCard.unitsSold}×)` : "–"}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Karten nach Umsatz</h2>
          <RankedCardList entries={topCardsByRevenue} valueLabel="revenue" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Karten nach Verkäufen</h2>
          <RankedCardList entries={topCardsBySales} valueLabel="unitsSold" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Sets nach Umsatz</h2>
          <RankedSetList entries={topSetsByRevenue} valueLabel="revenue" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Sets nach Verkäufen</h2>
          <RankedSetList entries={topSetsBySales} valueLabel="unitsSold" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Monatsübersicht (letzte 12 Monate)</h2>
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Monat</th>
                    <th className="py-2 pr-4 font-medium">Umsatz</th>
                    <th className="py-2 font-medium">Verkäufe</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.monthly.map((point) => (
                    <tr key={point.label} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono">{point.label}</td>
                      <td className="py-2 pr-4">{formatPrice(point.revenue)}</td>
                      <td className="py-2">{point.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Tagesübersicht (letzte 30 Tage)</h2>
          <Card>
            <CardContent className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Tag</th>
                    <th className="py-2 pr-4 font-medium">Umsatz</th>
                    <th className="py-2 font-medium">Verkäufe</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.daily.map((point) => (
                    <tr key={point.label} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono">{point.label}</td>
                      <td className="py-2 pr-4">{formatPrice(point.revenue)}</td>
                      <td className="py-2">{point.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Verkäufe</h2>

        {recentSales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Es liegen noch keine Verkäufe vor.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSales.map((sale) => (
              <Card key={sale.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                    {sale.cardImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                      <img src={sale.cardImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{sale.cardName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(sale.createdAt)} · Käufer-ID: {sale.buyerId}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground sm:text-right">
                    <p>
                      {formatPrice(sale.price)} × {sale.quantity}
                    </p>
                    <p className="font-medium text-foreground">{formatPrice(sale.subtotal)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function RankedCardList({
  entries,
  valueLabel,
}: {
  entries: { cardId: string; cardName: string; cardImage: string | null; setName: string; revenue: string; unitsSold: number }[];
  valueLabel: "revenue" | "unitsSold";
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Daten.</p>;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          <div key={entry.cardId} className="flex items-center gap-3 border-b py-2 last:border-0">
            <span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
            <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
              {entry.cardImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                <img src={entry.cardImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="size-3 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.cardName}</p>
              <p className="truncate text-xs text-muted-foreground">{entry.setName}</p>
            </div>
            <Badge variant="secondary">
              {valueLabel === "revenue" ? formatPrice(entry.revenue) : `${entry.unitsSold}×`}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RankedSetList({
  entries,
  valueLabel,
}: {
  entries: { setId: string; setName: string; revenue: string; unitsSold: number }[];
  valueLabel: "revenue" | "unitsSold";
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Daten.</p>;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          <div key={entry.setId} className="flex items-center gap-3 border-b py-2 last:border-0">
            <span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{entry.setName}</p>
            <Badge variant="secondary">
              {valueLabel === "revenue" ? formatPrice(entry.revenue) : `${entry.unitsSold}×`}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
