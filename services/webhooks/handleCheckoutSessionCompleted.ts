import type Stripe from "stripe";

import { createOrder } from "@/services/orders/createOrder";

/**
 * Reagiert auf eine erfolgreich abgeschlossene Stripe Checkout Session.
 * Ruft ausschließlich createOrder() auf – die eigentliche Business-Logik
 * (Order/OrderItems anlegen, Warenkorb leeren) lebt in services/orders/.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  await createOrder(session);
}
