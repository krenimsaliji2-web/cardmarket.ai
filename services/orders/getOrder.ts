import { prisma } from "@/lib/prisma";
import type { ShippingCarrier } from "@/prisma/generated/prisma/client";

export interface OrderDetailItemResult {
  id: string;
  cardName: string;
  cardImage: string | null;
  gameName: string;
  setName: string;
  sellerId: string;
  sellerName: string;
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

export interface OrderDetailResult {
  id: string;
  createdAt: Date;
  totalPrice: string;
  currency: string;
  itemCount: number;
  paymentStatus: string;
  orderStatus: string;
  stripeCheckoutSessionId: string;
  items: OrderDetailItemResult[];
}

/**
 * Lädt eine einzelne Bestellung, streng ownership-scoped (id + userId in
 * derselben Query) – "existiert nicht" und "gehört jemand anderem"
 * kollabieren dadurch in denselben null-Rückgabewert, ohne Informationen
 * preiszugeben (gleiches Muster wie in services/listing/*).
 *
 * Spiel/Set stehen (anders als Kartenname/-bild/Verkäufer/Sprache/Zustand)
 * nicht als eigener Snapshot auf OrderItem, sondern werden über die
 * bestehende listingId-Relation nachgeladen – Listing/Card/Game/Set können
 * wegen onDelete: Restrict nie gelöscht werden, solange eine Order auf sie
 * verweist, die Werte sind also immer auflösbar.
 */
export async function getOrder(orderId: string, userId: string): Promise<OrderDetailResult | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
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

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    createdAt: order.createdAt,
    totalPrice: order.totalPrice.toFixed(2),
    currency: order.currency,
    itemCount: order.items.length,
    paymentStatus: "Bezahlt",
    orderStatus: "Eingegangen",
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    items: order.items.map((item) => ({
      id: item.id,
      cardName: item.cardName,
      cardImage: item.cardImage,
      gameName: item.listing.card.game.name,
      setName: item.listing.card.set.name,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
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
}
