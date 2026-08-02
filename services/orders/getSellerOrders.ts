import { prisma } from "@/lib/prisma";
import { Prisma, type ShippingCarrier } from "@/prisma/generated/prisma/client";

export interface SellerOrderItemResult {
  id: string;
  cardName: string;
  cardImage: string | null;
  gameName: string;
  setName: string;
  language: string;
  condition: string;
  quantity: number;
  price: string;
  subtotal: string;
  /** Feature 52 – Versand & Tracking (siehe Schema-Kommentar bei OrderItem). */
  shippingCarrier: ShippingCarrier | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface SellerOrderResult {
  orderId: string;
  createdAt: Date;
  buyerId: string;
  itemCount: number;
  totalPrice: string;
  items: SellerOrderItemResult[];
}

/**
 * Lädt alle Bestellungen, die mindestens eine Position des eingeloggten
 * Verkäufers enthalten – neueste zuerst. Pro Bestellung werden dabei
 * AUSSCHLIESSLICH die eigenen Positionen zurückgegeben (Order-Filter über
 * `items: { some: { sellerId } }`, Item-Filter über das verschachtelte
 * `where: { sellerId }`), auch wenn dieselbe Bestellung Positionen anderer
 * Verkäufer enthält – deren Daten werden nie geladen oder preisgegeben.
 *
 * Gibt `null` zurück, wenn der User kein SellerProfile besitzt (die Route
 * leitet in diesem Fall nach /seller weiter statt selbst Prisma
 * abzufragen).
 */
export async function getSellerOrders(userId: string): Promise<SellerOrderResult[] | null> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!sellerProfile) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: { items: { some: { sellerId: sellerProfile.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      userId: true,
      items: {
        where: { sellerId: sellerProfile.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          cardName: true,
          cardImage: true,
          language: true,
          condition: true,
          quantity: true,
          price: true,
          subtotal: true,
          shippingCarrier: true,
          trackingNumber: true,
          trackingUrl: true,
          shippedAt: true,
          deliveredAt: true,
          listing: {
            select: {
              card: {
                select: {
                  game: { select: { name: true } },
                  set: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return orders.map((order) => {
    const totalPrice = order.items.reduce(
      (sum, item) => sum.plus(item.subtotal),
      new Prisma.Decimal(0),
    );

    return {
      orderId: order.id,
      createdAt: order.createdAt,
      buyerId: order.userId,
      itemCount: order.items.length,
      totalPrice: totalPrice.toFixed(2),
      items: order.items.map((item) => ({
        id: item.id,
        cardName: item.cardName,
        cardImage: item.cardImage,
        gameName: item.listing.card.game.name,
        setName: item.listing.card.set.name,
        language: item.language,
        condition: item.condition,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
        shippingCarrier: item.shippingCarrier,
        trackingNumber: item.trackingNumber,
        trackingUrl: item.trackingUrl,
        shippedAt: item.shippedAt,
        deliveredAt: item.deliveredAt,
      })),
    };
  });
}
