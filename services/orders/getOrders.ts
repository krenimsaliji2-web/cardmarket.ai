import { prisma } from "@/lib/prisma";

export interface OrderItemResult {
  id: string;
  cardName: string;
  cardImage: string | null;
  sellerName: string;
  language: string;
  condition: string;
  quantity: number;
  price: string;
  subtotal: string;
}

export interface OrderResult {
  id: string;
  createdAt: Date;
  totalPrice: string;
  currency: string;
  itemCount: number;
  paymentStatus: string;
  orderStatus: string;
  stripeCheckoutSessionId: string;
  items: OrderItemResult[];
}

/**
 * Lädt alle Bestellungen eines Users, neueste zuerst. Nutzt ausschließlich
 * die bestehenden Order-/OrderItem-Modelle (reiner Read, keine Änderung).
 *
 * Zahlungs-/Bestellstatus sind bewusst feste Werte statt eigener
 * Spalten: eine Order existiert im Schema erst, nachdem Stripe die Zahlung
 * bestätigt hat (siehe services/orders/createOrder.ts), der Zahlungsstatus
 * ist also für jede vorhandene Order immer "Bezahlt". Ein Fulfillment-/
 * Versandstatus ist explizit noch nicht Teil des Order-Modells (siehe
 * prisma/schema.prisma) und wird hier nicht miterfunden.
 */
export async function getOrders(userId: string): Promise<OrderResult[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return orders.map((order) => ({
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
      sellerName: item.sellerName,
      language: item.language,
      condition: item.condition,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  }));
}
