import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff, Star } from "lucide-react";

import { auth } from "@/lib/auth";
import { getSellerDashboard } from "@/services/seller/getSellerDashboard";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { ListingActions } from "./listing-actions";

export const metadata: Metadata = {
  title: "Verkäufer-Dashboard – Project Atlas",
};

export default async function SellerPage() {
  // Der Session-Check muss VOR jeder <Suspense>-Grenze laufen: ein
  // redirect() innerhalb eines Suspense-Baums (z. B. über eine
  // route-weite loading.tsx) sendet bereits einen 200-Status, bevor die
  // Umleitung bekannt ist – Next.js kann den Statuscode dann nicht mehr auf
  // 307 ändern und behilft sich mit einer Client-seitigen Umleitung. Für
  // Clients ohne JS (curl, Crawler) bliebe die Seite dann fälschlich bei
  // 200 hängen. Deshalb bewusst KEINE route-weite loading.tsx für /seller
  // (würde außerdem auf alle Geschwister-Routen wie /seller/[id] – eine
  // bewusst ÖFFENTLICHE Profilseite – ausstrahlen). Das Skeleton-Loading
  // (Ticket-Anforderung) sitzt stattdessen gezielt NUR um den
  // datenabhängigen Teil unten, siehe <Suspense> dort.
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <SellerDashboardContent userId={session.user.id} />
    </Suspense>
  );
}

async function SellerDashboardContent({ userId }: { userId: string }) {
  const dashboard = await getSellerDashboard(userId);

  if (!dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Du bist noch kein Verkäufer.</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/seller/new">Verkäufer werden</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { stats, listings, recentSales, topListings, recentReviews } = dashboard;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.displayName}</h1>
          <Badge variant={dashboard.verified ? "default" : "outline"}>
            {dashboard.verified ? "Verifiziert" : "Nicht verifiziert"}
          </Badge>
        </div>
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/seller/${dashboard.id}`}>Öffentliches Profil ansehen</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gesamtumsatz" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Umsatz heute" value={formatPrice(stats.revenueToday)} />
        <StatCard label="Umsatz letzte 7 Tage" value={formatPrice(stats.revenueLast7Days)} />
        <StatCard
          label="Durchschnittlicher Verkaufspreis"
          value={formatPrice(stats.averageSalePrice)}
        />
        <StatCard label="Verkäufe insgesamt" value={stats.totalSales} />
        <StatCard label="Verkäufe heute" value={stats.salesToday} />
        <StatCard label="Verkäufe diesen Monat" value={stats.salesThisMonth} />
        <StatCard
          label="Durchschnittlicher Bestellwert"
          value={formatPrice(stats.averageOrderValue)}
        />
        <StatCard label="Aktive Listings" value={stats.activeListings} />
        <StatCard label="Verkaufte Listings" value={stats.soldOutListings} />
        <StatCard label="Inaktive Listings" value={stats.inactiveListings} />
        <StatCard label="Gesamtbestand" value={stats.totalStock} />
        <StatCard
          label="Durchschnittsbewertung"
          value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : "–"}
        />
        <StatCard label="Anzahl Bewertungen" value={stats.totalReviews} />
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/seller/new-listing">Karte verkaufen</Link>
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Top Listings</h2>

        {topListings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Verkäufe – hier erscheinen deine umsatzstärksten Listings.</p>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Karte</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Verkauft</th>
                    <th className="py-2 font-medium">Umsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {topListings.map((entry) => (
                    <tr key={entry.listingId} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                            {entry.cardImage ? (
                              // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                              <img src={entry.cardImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="size-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className="min-w-0 truncate font-medium">{entry.cardName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={entry.isActive ? "default" : "outline"}>
                          {entry.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{entry.unitsSold}×</td>
                      <td className="py-2 font-medium">{formatPrice(entry.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Bestellungen</h2>

        {recentSales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Es liegen noch keine Verkäufe vor.</p>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Karte</th>
                    <th className="py-2 pr-4 font-medium">Datum</th>
                    <th className="py-2 pr-4 font-medium">Menge</th>
                    <th className="py-2 pr-4 font-medium">Preis</th>
                    <th className="py-2 font-medium">Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                            {sale.cardImage ? (
                              // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                              <img src={sale.cardImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="size-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className="min-w-0 truncate font-medium">{sale.cardName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="py-2 pr-4">{sale.quantity}</td>
                      <td className="py-2 pr-4">{formatPrice(sale.price)}</td>
                      <td className="py-2 font-medium">{formatPrice(sale.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Bewertungen</h2>

        {recentReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Es liegen noch keine Bewertungen vor.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={
                              star <= review.rating
                                ? "size-4 fill-yellow-400 text-yellow-400"
                                : "size-4 text-muted-foreground"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.buyerName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/90">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Meine Listings</h2>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Du hast noch keine Listings erstellt.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                    {listing.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- lokale/externe Bild-URL.
                      <img
                        src={listing.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{listing.cardName}</p>
                      <Badge variant={listing.isActive ? "default" : "outline"}>
                        {listing.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.gameName} · {listing.setName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(listing.price)} · {listing.language} ·{" "}
                      {listing.condition} · Menge: {listing.quantity}
                    </p>
                  </div>

                  <ListingActions listingId={listing.id} isActive={listing.isActive} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

/** Skeleton-Fallback für den datenabhängigen Teil (Suspense-Grenze in SellerPage), NICHT für den Auth-Check. */
function DashboardSkeleton() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Skeleton className="h-10 w-40" />

      {Array.from({ length: 3 }).map((_, index) => (
        <section key={index} className="flex flex-col gap-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-40 w-full" />
        </section>
      ))}
    </main>
  );
}
