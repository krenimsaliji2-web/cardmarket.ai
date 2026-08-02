import { Prisma } from "@/prisma/generated/prisma/client";

import type { ValidatedCartItem } from "./validateCart";

export interface CheckoutTotals {
  subtotal: string;
  shipping: string;
  total: string;
}

// Versand ist in dieser Grundlage fix 0.00 – eine echte Versandberechnung
// folgt erst mit einem späteren Feature.
const SHIPPING_COST = new Prisma.Decimal(0);

/**
 * Berechnet Zwischensumme/Versand/Gesamtsumme ausschließlich über
 * Prisma.Decimal, um Floating-Point-Ungenauigkeit bei Geldbeträgen zu
 * vermeiden (gleiches Prinzip wie in services/cart/getCart.ts).
 */
export function calculateTotals(items: ValidatedCartItem[]): CheckoutTotals {
  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.price.times(item.quantity)),
    new Prisma.Decimal(0),
  );
  const total = subtotal.plus(SHIPPING_COST);

  return {
    subtotal: subtotal.toFixed(2),
    shipping: SHIPPING_COST.toFixed(2),
    total: total.toFixed(2),
  };
}
