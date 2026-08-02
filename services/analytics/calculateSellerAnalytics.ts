import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";

const MONTHLY_CHART_MONTHS = 12;
const DAILY_CHART_DAYS = 30;
const TOP_LIMIT = 10;
const RECENT_SALES_LIMIT = 20;

export interface SellerAnalyticsStats {
  totalRevenue: string;
  totalSales: number;
  averageOrderValue: string;
  totalCardsSold: number;
  averageCardPrice: string;
  bestSellingCard: { cardId: string; cardName: string; unitsSold: number } | null;
  revenueToday: string;
  revenueThisWeek: string;
  revenueThisMonth: string;
  revenueThisYear: string;
}

export interface RevenuePoint {
  label: string;
  revenue: string;
  sales: number;
}

export interface SellerAnalyticsCharts {
  /** Letzte 12 Kalendermonate (inkl. aktuellem), Label "YYYY-MM". */
  monthly: RevenuePoint[];
  /** Letzte 30 Kalendertage (inkl. heute), Label "YYYY-MM-DD". */
  daily: RevenuePoint[];
}

export interface TopCardEntry {
  cardId: string;
  cardName: string;
  cardImage: string | null;
  setName: string;
  revenue: string;
  unitsSold: number;
}

export interface TopSetEntry {
  setId: string;
  setName: string;
  revenue: string;
  unitsSold: number;
}

export interface RecentSale {
  id: string;
  createdAt: Date;
  cardName: string;
  cardImage: string | null;
  buyerId: string;
  quantity: number;
  price: string;
  subtotal: string;
}

export interface SellerAnalyticsResult {
  stats: SellerAnalyticsStats;
  charts: SellerAnalyticsCharts;
  topCardsByRevenue: TopCardEntry[];
  topCardsBySales: TopCardEntry[];
  topSetsByRevenue: TopSetEntry[];
  topSetsBySales: TopSetEntry[];
  recentSales: RecentSale[];
}

/**
 * Berechnet die vollständigen Verkäufer-Analytics ausschließlich aus
 * bestehenden Order-/OrderItem-/Listing-Daten (reiner Read, keine
 * Datenänderung). Lädt alle OrderItems des Verkäufers EINMAL (indiziert
 * über sellerId) und leitet alle Kennzahlen/Charts/Top-Listen daraus in JS
 * ab, statt vieler einzelner DB-Aggregationen – gleiches Performance-Muster
 * wie calculateMarketPrice()/calculatePortfolio() aus Feature 39/41.
 *
 * "Verkäufe" = einzelne OrderItem-Positionen (Transaktionen), nicht
 * Bestellungen – konsistent mit getSellerDashboard.ts (Feature 34)/
 * getSellerOrders.ts (Feature 33). "Durchschnittlicher Bestellwert" ist
 * Gesamtumsatz ÷ Anzahl DISTINCT Bestellungen (AOV), "durchschnittlicher
 * Kartenpreis" ist Gesamtumsatz ÷ Gesamtanzahl verkaufter Karten (Stück).
 * "Bestverkaufte Karte" = höchste verkaufte Stückzahl (nicht Umsatz – dafür
 * gibt es topCardsByRevenue).
 */
export async function calculateSellerAnalytics(sellerId: string): Promise<SellerAnalyticsResult> {
  const items = await prisma.orderItem.findMany({
    where: { sellerId },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      quantity: true,
      price: true,
      subtotal: true,
      cardName: true,
      cardImage: true,
      orderId: true,
      order: { select: { createdAt: true, userId: true } },
      listing: {
        select: {
          cardId: true,
          card: {
            select: {
              name: true,
              image: true,
              setId: true,
              set: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let totalRevenue = new Prisma.Decimal(0);
  let totalCardsSold = 0;
  let revenueToday = new Prisma.Decimal(0);
  let revenueThisWeek = new Prisma.Decimal(0);
  let revenueThisMonth = new Prisma.Decimal(0);
  let revenueThisYear = new Prisma.Decimal(0);

  const revenueByOrder = new Map<string, Prisma.Decimal>();
  const cardStats = new Map<
    string,
    { cardId: string; cardName: string; cardImage: string | null; setName: string; revenue: Prisma.Decimal; unitsSold: number }
  >();
  const setStats = new Map<string, { setId: string; setName: string; revenue: Prisma.Decimal; unitsSold: number }>();
  const monthlyBuckets = new Map<string, { revenue: Prisma.Decimal; sales: number }>();
  const dailyBuckets = new Map<string, { revenue: Prisma.Decimal; sales: number }>();

  for (const item of items) {
    const subtotal = item.subtotal;
    const saleDate = item.order.createdAt;

    totalRevenue = totalRevenue.plus(subtotal);
    totalCardsSold += item.quantity;

    revenueByOrder.set(item.orderId, (revenueByOrder.get(item.orderId) ?? new Prisma.Decimal(0)).plus(subtotal));

    if (saleDate >= startOfToday) revenueToday = revenueToday.plus(subtotal);
    if (saleDate >= startOfWeek) revenueThisWeek = revenueThisWeek.plus(subtotal);
    if (saleDate >= startOfMonth) revenueThisMonth = revenueThisMonth.plus(subtotal);
    if (saleDate >= startOfYear) revenueThisYear = revenueThisYear.plus(subtotal);

    const cardId = item.listing.cardId;
    const cardEntry = cardStats.get(cardId) ?? {
      cardId,
      cardName: item.listing.card.name,
      cardImage: item.listing.card.image,
      setName: item.listing.card.set.name,
      revenue: new Prisma.Decimal(0),
      unitsSold: 0,
    };
    cardEntry.revenue = cardEntry.revenue.plus(subtotal);
    cardEntry.unitsSold += item.quantity;
    cardStats.set(cardId, cardEntry);

    const setId = item.listing.card.setId;
    const setEntry = setStats.get(setId) ?? {
      setId,
      setName: item.listing.card.set.name,
      revenue: new Prisma.Decimal(0),
      unitsSold: 0,
    };
    setEntry.revenue = setEntry.revenue.plus(subtotal);
    setEntry.unitsSold += item.quantity;
    setStats.set(setId, setEntry);

    const monthKey = formatMonthKey(saleDate);
    const monthBucket = monthlyBuckets.get(monthKey) ?? { revenue: new Prisma.Decimal(0), sales: 0 };
    monthBucket.revenue = monthBucket.revenue.plus(subtotal);
    monthBucket.sales += 1;
    monthlyBuckets.set(monthKey, monthBucket);

    const dayKey = formatDayKey(saleDate);
    const dayBucket = dailyBuckets.get(dayKey) ?? { revenue: new Prisma.Decimal(0), sales: 0 };
    dayBucket.revenue = dayBucket.revenue.plus(subtotal);
    dayBucket.sales += 1;
    dailyBuckets.set(dayKey, dayBucket);
  }

  const distinctOrderCount = revenueByOrder.size;
  const averageOrderValue =
    distinctOrderCount === 0 ? new Prisma.Decimal(0) : totalRevenue.dividedBy(distinctOrderCount);
  const averageCardPrice =
    totalCardsSold === 0 ? new Prisma.Decimal(0) : totalRevenue.dividedBy(totalCardsSold);

  const cardEntries = [...cardStats.values()];
  const setEntries = [...setStats.values()];

  const bestSellingCardEntry = cardEntries.reduce<
    { cardId: string; cardName: string; unitsSold: number } | null
  >((best, entry) => {
    if (!best || entry.unitsSold > best.unitsSold) {
      return { cardId: entry.cardId, cardName: entry.cardName, unitsSold: entry.unitsSold };
    }
    return best;
  }, null);

  const monthly = buildDenseSeries(monthlyBuckets, MONTHLY_CHART_MONTHS, "month", now);
  const daily = buildDenseSeries(dailyBuckets, DAILY_CHART_DAYS, "day", now);

  return {
    stats: {
      totalRevenue: totalRevenue.toFixed(2),
      totalSales: items.length,
      averageOrderValue: averageOrderValue.toFixed(2),
      totalCardsSold,
      averageCardPrice: averageCardPrice.toFixed(2),
      bestSellingCard: bestSellingCardEntry,
      revenueToday: revenueToday.toFixed(2),
      revenueThisWeek: revenueThisWeek.toFixed(2),
      revenueThisMonth: revenueThisMonth.toFixed(2),
      revenueThisYear: revenueThisYear.toFixed(2),
    },
    charts: { monthly, daily },
    topCardsByRevenue: [...cardEntries]
      .sort((a, b) => b.revenue.comparedTo(a.revenue))
      .slice(0, TOP_LIMIT)
      .map(toTopCardEntry),
    topCardsBySales: [...cardEntries]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, TOP_LIMIT)
      .map(toTopCardEntry),
    topSetsByRevenue: [...setEntries]
      .sort((a, b) => b.revenue.comparedTo(a.revenue))
      .slice(0, TOP_LIMIT)
      .map(toTopSetEntry),
    topSetsBySales: [...setEntries]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, TOP_LIMIT)
      .map(toTopSetEntry),
    recentSales: items.slice(0, RECENT_SALES_LIMIT).map((item) => ({
      id: item.id,
      createdAt: item.order.createdAt,
      cardName: item.cardName,
      cardImage: item.cardImage,
      buyerId: item.order.userId,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  };
}

function toTopCardEntry(entry: {
  cardId: string;
  cardName: string;
  cardImage: string | null;
  setName: string;
  revenue: Prisma.Decimal;
  unitsSold: number;
}): TopCardEntry {
  return {
    cardId: entry.cardId,
    cardName: entry.cardName,
    cardImage: entry.cardImage,
    setName: entry.setName,
    revenue: entry.revenue.toFixed(2),
    unitsSold: entry.unitsSold,
  };
}

function toTopSetEntry(entry: { setId: string; setName: string; revenue: Prisma.Decimal; unitsSold: number }): TopSetEntry {
  return {
    setId: entry.setId,
    setName: entry.setName,
    revenue: entry.revenue.toFixed(2),
    unitsSold: entry.unitsSold,
  };
}

/** Montag-basierter Wochenstart (deutsche Konvention). */
function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Erzeugt eine lückenlose Zeitreihe der letzten `count` Monate/Tage (auch
 * Buckets ohne Verkäufe werden mit 0 aufgeführt) – nützlich für eine
 * spätere Chart-Darstellung, auch wenn dieses Feature selbst noch keine
 * Chart-Bibliothek einbindet.
 */
function buildDenseSeries(
  buckets: Map<string, { revenue: Prisma.Decimal; sales: number }>,
  count: number,
  unit: "month" | "day",
  now: Date,
): RevenuePoint[] {
  const series: RevenuePoint[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const date =
      unit === "month"
        ? new Date(now.getFullYear(), now.getMonth() - i, 1)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = unit === "month" ? formatMonthKey(date) : formatDayKey(date);
    const bucket = buckets.get(key);

    series.push({
      label: key,
      revenue: (bucket?.revenue ?? new Prisma.Decimal(0)).toFixed(2),
      sales: bucket?.sales ?? 0,
    });
  }

  return series;
}
