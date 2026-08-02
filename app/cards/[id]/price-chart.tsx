"use client";

import { useState } from "react";

import { formatPrice } from "@/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PriceChartPointData {
  date: string;
  averagePrice: string;
  salesCount: number;
}

export interface MarketPriceWindowData {
  average: string | null;
  lowest: string | null;
  highest: string | null;
  median: string | null;
  salesCount: number;
  lastSaleAt: string | null;
}

interface PriceChartProps {
  ranges: {
    "7d": { stats: MarketPriceWindowData; points: PriceChartPointData[] };
    "30d": { stats: MarketPriceWindowData; points: PriceChartPointData[] };
    "90d": { stats: MarketPriceWindowData; points: PriceChartPointData[] };
  };
  currency: string;
}

const RANGE_OPTIONS = [
  { key: "7d" as const, label: "7 Tage" },
  { key: "30d" as const, label: "30 Tage" },
  { key: "90d" as const, label: "90 Tage" },
];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const CHART_PADDING = 8;

function formatShortDate(isoDay: string): string {
  const [, month, day] = isoDay.split("-");
  return `${day}.${month}.`;
}

/** Reines SVG-Liniendiagramm, keine externe Chart-Bibliothek (keine neue Dependency). */
function PriceLineChart({ points }: { points: PriceChartPointData[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        Keine Verkäufe in diesem Zeitraum.
      </div>
    );
  }

  const prices = points.map((point) => Number(point.averagePrice));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Bei nur einem Punkt oder identischen Preisen: künstliche Spanne, damit die Linie nicht auf den Rand kollabiert.
  const priceRange = maxPrice - minPrice || 1;

  const usableWidth = CHART_WIDTH - CHART_PADDING * 2;
  const usableHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? CHART_WIDTH / 2
        : CHART_PADDING + (index / (points.length - 1)) * usableWidth;
    const y =
      CHART_PADDING + usableHeight - ((Number(point.averagePrice) - minPrice) / priceRange) * usableHeight;
    return { x, y, point };
  });

  const linePath = coordinates.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="h-[180px] w-full"
      role="img"
      aria-label="Preisverlauf-Diagramm"
    >
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} className="text-primary" />
      {coordinates.map((c) => (
        <circle key={c.point.date} cx={c.x} cy={c.y} r={3} className="fill-primary">
          <title>
            {formatShortDate(c.point.date)}: {formatPrice(c.point.averagePrice)} ({c.point.salesCount}{" "}
            {c.point.salesCount === 1 ? "Verkauf" : "Verkäufe"})
          </title>
        </circle>
      ))}
    </svg>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

/** Zeigt Marktstatistik (Durchschnitt/Tiefst-/Höchstpreis) + Preisverlauf-Diagramm für 7/30/90 Tage. Alle Daten kommen bereits serverseitig aufbereitet als Props. */
export function PriceChart({ ranges, currency }: PriceChartProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const current = ranges[range];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Preisentwicklung</CardTitle>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.key}
              type="button"
              size="sm"
              variant={range === option.key ? "default" : "outline"}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {current.stats.salesCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Für diesen Zeitraum liegen noch keine Verkaufsdaten vor.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <StatBox label="Durchschnitt" value={`${formatPrice(current.stats.average!)} ${currency.toUpperCase()}`} />
              <StatBox label="Tiefstpreis" value={`${formatPrice(current.stats.lowest!)} ${currency.toUpperCase()}`} />
              <StatBox label="Höchstpreis" value={`${formatPrice(current.stats.highest!)} ${currency.toUpperCase()}`} />
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">Verkäufe</dt>
                <dd className="mt-1">
                  <Badge variant="secondary">{current.stats.salesCount}</Badge>
                </dd>
              </div>
            </dl>

            <PriceLineChart points={current.points} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
