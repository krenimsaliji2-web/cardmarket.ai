import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
}

// Einziger Initialisierungspunkt für den Stripe-Client im gesamten Projekt.
export const stripe = new Stripe(secretKey);
