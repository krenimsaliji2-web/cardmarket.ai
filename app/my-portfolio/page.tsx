import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ImageOff } from "lucide-react";

import { auth } from "@/lib/auth";
import { getPortfolio } from "@/services/portfolio/getPortfolio";
import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mein Portfolio – Project Atlas",
};

export default async function MyPortfolioPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const portfolio = await getPortfolio(session.user.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Mein Portfolio</h1>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gesamtwert" value={formatPrice(portfolio.totalValue)} />
        <StatCard label="Gesamtkaufpreis" value={formatPrice(portfolio.totalPurchasePrice)} />
        <StatCard label="Gewinn" value={formatPrice(portfolio.totalProfit)} positive />
        <StatCard label="Verlust" value={formatPrice(portfolio.totalLoss)} negative />
        <StatCard
          label="Performance"
          value={portfolio.performancePercent !== null ? `${portfolio.performancePercent} %` : "–"}
          positive={portfolio.performancePercent !== null && Number(portfolio.performancePercent) > 0}
          negative={portfolio.performancePercent !== null && Number(portfolio.performancePercent) < 0}
        />
        <StatCard label="Anzahl Karten" value={String(portfolio.totalCardCount)} />
        <StatCard label="Unterschiedliche Karten" value={String(portfolio.uniqueCardCount)} />
        <StatCard label="Ø Kartenwert" value={formatPrice(portfolio.averageCardValue)} />
      </section>

      {(portfolio.mostExpensiveCard || portfolio.mostValuablePosition) && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {portfolio.mostExpensiveCard && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Teuerste Karte (pro Stück)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{portfolio.mostExpensiveCard.cardName}</p>
                <p className="text-xl font-bold">{formatPrice(portfolio.mostExpensiveCard.value)}</p>
              </CardContent>
            </Card>
          )}
          {portfolio.mostValuablePosition && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Wertvollste Position (gesamt)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{portfolio.mostValuablePosition.cardName}</p>
                <p className="text-xl font-bold">{formatPrice(portfolio.mostValuablePosition.value)}</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {portfolio.positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Dein Portfolio ist noch leer – füge Karten zu deiner Sammlung hinzu.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {portfolio.positions.map((position) => {
            const profit = position.profitLoss !== null ? Number(position.profitLoss) : null;
            return (
              <Card key={position.collectionItemId}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                    {position.cardImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- externe Bild-URLs aus dem Import.
                      <img
                        src={position.cardImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{position.cardName}</p>
                      {position.foil && <Badge variant="secondary">Foil</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{position.setName}</p>
                    <p className="text-sm text-muted-foreground">
                      {position.language} · {position.condition} · Menge: {position.quantity}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground sm:text-right">
                    <p>
                      Kaufpreis:{" "}
                      {position.purchasePricePerUnit !== null
                        ? formatPrice(position.purchasePricePerUnit)
                        : "–"}
                    </p>
                    <p>
                      Marktpreis:{" "}
                      {position.marketPricePerUnit !== null
                        ? formatPrice(position.marketPricePerUnit)
                        : "–"}
                    </p>
                    <p className="font-medium text-foreground">
                      Gesamt: {formatPrice(position.totalMarketValue)}
                    </p>
                  </div>

                  <div className="text-sm sm:text-right">
                    {profit !== null ? (
                      <>
                        <p className={profit >= 0 ? "font-medium text-emerald-600" : "font-medium text-destructive"}>
                          {profit >= 0 ? "+" : ""}
                          {formatPrice(position.profitLoss!)}
                        </p>
                        <p className={profit >= 0 ? "text-emerald-600" : "text-destructive"}>
                          {position.profitLossPercent !== null
                            ? `${Number(position.profitLossPercent) >= 0 ? "+" : ""}${position.profitLossPercent} %`
                            : "–"}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Kaufpreis unbekannt</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            positive
              ? "text-3xl font-bold tracking-tight text-emerald-600"
              : negative
                ? "text-3xl font-bold tracking-tight text-destructive"
                : "text-3xl font-bold tracking-tight"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
