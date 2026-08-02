import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDashboard } from "@/services/admin/getDashboard";
import { formatDate } from "@/utils/formatDate";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin-Dashboard – Project Atlas",
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const dashboard = await getDashboard(session.user.id);

  if (!dashboard) {
    notFound();
  }

  const { stats, recentUsers, recentOrders, recentReviews, topSellers, topCards } = dashboard;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin-Dashboard</h1>

      <AdminNav active="dashboard" />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Benutzer" value={String(stats.totalUsers)} />
        <StatCard label="Verkäufer" value={String(stats.totalSellers)} />
        <StatCard label="Listings" value={String(stats.totalListings)} />
        <StatCard label="Aktive Listings" value={String(stats.activeListings)} />
        <StatCard label="Inaktive Listings" value={String(stats.inactiveListings)} />
        <StatCard label="Bestellungen" value={String(stats.totalOrders)} />
        <StatCard label="Gesamtumsatz" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Verkaufte Karten" value={String(stats.totalCardsSold)} />
        <StatCard label="Bewertungen" value={String(stats.totalReviews)} />
        <StatCard
          label="Ø Bewertung"
          value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : "–"}
        />
        <StatCard label="Collections" value={String(stats.totalCollections)} />
        <StatCard label="Wishlists" value={String(stats.totalWishlists)} />
        <StatCard label="Notifications" value={String(stats.totalNotifications)} />
        <StatCard label="Preisverlauf-Einträge" value={String(stats.totalPriceHistoryEntries)} />
        <StatCard label="Importierte Karten" value={String(stats.totalImportedCards)} />
        <StatCard label="Importierte Sets" value={String(stats.totalImportedSets)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Verkäufer nach Umsatz</h2>
          <Card>
            <CardContent className="flex flex-col gap-2">
              {topSellers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Daten.</p>
              ) : (
                topSellers.map((seller, index) => (
                  <div key={seller.sellerId} className="flex items-center gap-3 border-b py-2 last:border-0">
                    <span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{seller.sellerName}</p>
                    <Badge variant="secondary">{formatPrice(seller.revenue)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Top 10 Karten nach Verkäufen</h2>
          <Card>
            <CardContent className="flex flex-col gap-2">
              {topCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Daten.</p>
              ) : (
                topCards.map((card, index) => (
                  <div key={card.cardId} className="flex items-center gap-3 border-b py-2 last:border-0">
                    <span className="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{card.cardName}</p>
                    <Badge variant="secondary">{card.unitsSold}×</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Benutzer</h2>
        <Card>
          <CardContent className="overflow-x-auto">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Benutzer.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">E-Mail</th>
                    <th className="py-2 pr-4 font-medium">Rolle</th>
                    <th className="py-2 font-medium">Registriert</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{user.name}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                      </td>
                      <td className="py-2">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Bestellungen</h2>
        <Card>
          <CardContent className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Bestellnummer</th>
                    <th className="py-2 pr-4 font-medium">Käufer</th>
                    <th className="py-2 pr-4 font-medium">Betrag</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{order.id}</td>
                      <td className="py-2 pr-4">
                        {order.buyerName}
                        <span className="block text-xs text-muted-foreground">{order.buyerEmail}</span>
                      </td>
                      <td className="py-2 pr-4">{formatPrice(order.totalPrice)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="default">{order.status}</Badge>
                      </td>
                      <td className="py-2">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Neueste Bewertungen</h2>
        <Card>
          <CardContent className="overflow-x-auto">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Bewertungen.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Verkäufer</th>
                    <th className="py-2 pr-4 font-medium">Bewertung</th>
                    <th className="py-2 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReviews.map((review) => (
                    <tr key={review.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{review.sellerName}</td>
                      <td className="py-2 pr-4">{review.rating} / 5</td>
                      <td className="py-2">{formatDate(review.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
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
