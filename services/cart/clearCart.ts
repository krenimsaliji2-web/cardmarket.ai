import { prisma } from "@/lib/prisma";

/**
 * Leert den Warenkorb eines Users vollständig (z. B. nach erfolgreich
 * abgeschlossenem Stripe-Checkout, siehe
 * services/webhooks/handleCheckoutSessionCompleted.ts). Kein Fehler, falls
 * noch gar kein Cart existiert.
 */
export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
}
