import type Stripe from "stripe";

import { handleCheckoutSessionCompleted } from "./handleCheckoutSessionCompleted";

/**
 * Verteilt ein verifiziertes Stripe-Event an den zuständigen Handler.
 * Die Route (app/api/stripe/webhook/route.ts) ruft ausschließlich diese
 * Funktion auf – die eigentliche Verarbeitung lebt in den einzelnen
 * handle*.ts-Dateien in diesem Verzeichnis.
 */
export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    default:
      // Andere Event-Typen werden aktuell nicht verarbeitet.
      break;
  }
}
