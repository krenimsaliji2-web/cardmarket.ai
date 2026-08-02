import type Stripe from "stripe";

import { calculateTotals } from "@/services/checkout/calculateTotals";
import { validateCart, type PriceExpectation } from "@/services/checkout/validateCart";

import { stripe } from "./stripe";

export type CreateCheckoutSessionResult =
  | { status: "ok"; url: string }
  | { status: "error"; reason: "empty_cart" | "listing_changed" | "own_listing" };

function toAbsoluteImageUrl(url: string, origin: string): string {
  return url.startsWith("http") ? url : `${origin}${url}`;
}

/**
 * Erstellt eine echte Stripe Checkout Session für den aktuellen Warenkorb.
 * Validiert den Warenkorb erneut (dieselbe Logik wie die Checkout-Grundlage
 * aus Feature 26) und leitet den User anschließend zu Stripe weiter. Erstellt
 * bewusst KEINE Order, KEINE Zahlungsbestätigung und ändert keinen Bestand –
 * das folgt erst mit Webhook-Handling in einem späteren Feature.
 */
export async function createCheckoutSession(
  userId: string,
  priceExpectations: PriceExpectation[],
  origin: string,
): Promise<CreateCheckoutSessionResult> {
  const cartResult = await validateCart(userId, priceExpectations);

  if (cartResult.status === "error") {
    return cartResult;
  }

  // Totals dienen hier als zusätzliche serverseitige Bestätigung, dass die
  // pro Position berechneten Beträge konsistent sind (Prisma.Decimal statt
  // number) – die eigentliche Summe berechnet Stripe selbst aus den Line
  // Items.
  calculateTotals(cartResult.items);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartResult.items.map(
    (item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "chf",
        // Stripe erwartet den Betrag in Rappen (kleinste Währungseinheit).
        // .times(100) auf dem Decimal-Preis statt number-Multiplikation, um
        // Floating-Point-Ungenauigkeit bei Geldbeträgen zu vermeiden.
        unit_amount: Number(item.price.times(100).toFixed(0)),
        product_data: {
          name: item.cardName,
          images: item.cardImage ? [toAbsoluteImageUrl(item.cardImage, origin)] : undefined,
        },
      },
    }),
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    // {CHECKOUT_SESSION_ID} wird von Stripe selbst vor dem Redirect ersetzt
    // – die Erfolgsseite kann die Session damit serverseitig gegen
    // stripe.checkout.sessions.retrieve() nachschlagen (siehe
    // app/checkout/success/page.tsx), da der Webhook (asynchron, siehe
    // app/api/stripe/webhook/route.ts) die Order zu diesem Zeitpunkt noch
    // nicht zwingend schon angelegt hat.
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    // Verknüpft die Session mit dem User, damit der Webhook-Handler
    // (services/webhooks/handleCheckoutSessionCompleted.ts) weiß, wessen
    // Warenkorb geleert werden muss.
    client_reference_id: userId,
  });

  if (!session.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

  return { status: "ok", url: session.url };
}
