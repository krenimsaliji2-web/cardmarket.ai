import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCart } from "@/services/cart/getCart";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout – Project Atlas",
};

export default async function CheckoutPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const cart = await getCart(session.user.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      {cart.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Dein Warenkorb ist leer. Es gibt nichts zum Bezahlen.
        </p>
      ) : (
        <CheckoutForm cart={cart} />
      )}
    </main>
  );
}
