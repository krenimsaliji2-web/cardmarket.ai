import { calculateTotals, type CheckoutTotals } from "./calculateTotals";
import { validateCart, type PriceExpectation } from "./validateCart";

export type CreateCheckoutResult =
  | { status: "ok"; totals: CheckoutTotals }
  | { status: "error"; reason: "empty_cart" | "listing_changed" | "own_listing" };

/**
 * Checkout-Grundlage: validiert den Warenkorb erneut gegen die aktuelle DB
 * und berechnet die Summen. Erstellt bewusst noch KEINE Bestellung und löst
 * keine Zahlung aus – das folgt erst mit der Stripe-Integration in einem
 * späteren Feature.
 */
export async function createCheckout(
  userId: string,
  priceExpectations: PriceExpectation[],
): Promise<CreateCheckoutResult> {
  const cartResult = await validateCart(userId, priceExpectations);

  if (cartResult.status === "error") {
    return cartResult;
  }

  const totals = calculateTotals(cartResult.items);
  return { status: "ok", totals };
}
