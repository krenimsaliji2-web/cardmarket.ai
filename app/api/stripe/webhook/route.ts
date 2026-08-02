import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/services/stripe/stripe";
import { dispatchStripeEvent } from "@/services/webhooks/dispatchStripeEvent";

/**
 * Empfängt Stripe-Webhook-Events. Enthält bewusst KEINE Business-Logik –
 * liest nur den Raw Body, verifiziert die Signatur und delegiert an
 * dispatchStripeEvent() (services/webhooks/).
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Fehlende Signatur oder STRIPE_WEBHOOK_SECRET nicht gesetzt." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ungültige Signatur.";
    return NextResponse.json(
      { error: `Webhook-Signatur-Verifizierung fehlgeschlagen: ${message}` },
      { status: 400 },
    );
  }

  await dispatchStripeEvent(event);

  return NextResponse.json({ received: true });
}
