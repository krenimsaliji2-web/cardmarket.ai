"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { shippingAddressSchema } from "@/lib/validation/shippingAddress";
import type { PriceExpectation } from "@/services/checkout/validateCart";
import { createCheckoutSession } from "@/services/stripe/createCheckoutSession";

export interface CheckoutFormState {
  errors: {
    firstName?: string;
    lastName?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    cart?: string;
  };
}

const CART_ERROR_MESSAGES: Record<string, string> = {
  empty_cart: "Dein Warenkorb ist leer.",
  listing_changed: "Dieses Angebot wurde geändert. Bitte aktualisiere deinen Warenkorb.",
  own_listing: "Du kannst dein eigenes Angebot nicht kaufen. Bitte entferne es aus deinem Warenkorb.",
};

export async function createCheckoutAction(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const rawPhone = formData.get("phone");

  const addressResult = shippingAddressSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    street: String(formData.get("street") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    phone: typeof rawPhone === "string" && rawPhone.trim() !== "" ? rawPhone : undefined,
  });

  if (!addressResult.success) {
    const errors: CheckoutFormState["errors"] = {};
    for (const issue of addressResult.error.issues) {
      const key = issue.path[0] as keyof CheckoutFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { errors };
  }

  // Preis-Snapshot aus dem zuletzt gerenderten Warenkorb (siehe
  // checkout-form.tsx) – wird gegen die aktuellen Listing-Preise geprüft,
  // um zwischenzeitliche Preisänderungen zu erkennen.
  let priceExpectations: PriceExpectation[] = [];
  const rawSnapshot = formData.get("priceSnapshot");
  if (typeof rawSnapshot === "string") {
    try {
      priceExpectations = JSON.parse(rawSnapshot) as PriceExpectation[];
    } catch {
      priceExpectations = [];
    }
  }

  const origin = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (!origin) {
    throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL ist nicht gesetzt.");
  }

  const result = await createCheckoutSession(session.user.id, priceExpectations, origin);

  if (result.status === "error") {
    return { errors: { cart: CART_ERROR_MESSAGES[result.reason] } };
  }

  // Erstellt bewusst keine Order und bestätigt keine Zahlung – das folgt
  // erst mit Webhook-Handling in einem späteren Feature. Hier wird nur zur
  // echten Stripe Checkout Session weitergeleitet.
  redirect(result.url);
}
