"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { addToCart } from "@/services/cart/addToCart";
import { removeFromCart } from "@/services/cart/removeFromCart";
import { updateQuantity } from "@/services/cart/updateQuantity";

export interface CartActionResult {
  success: boolean;
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  listing_not_found: "Dieses Angebot existiert nicht mehr.",
  listing_inactive: "Dieses Angebot ist nicht mehr aktiv.",
  own_listing: "Du kannst dein eigenes Angebot nicht in den Warenkorb legen.",
  invalid_quantity: "Ungültige Menge.",
  not_found: "Dieser Warenkorb-Eintrag wurde nicht gefunden.",
};

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

export async function addToCartAction(
  listingId: string,
  quantity = 1,
): Promise<CartActionResult> {
  const userId = await requireUserId();
  const result = await addToCart(userId, listingId, quantity);

  if (result.status === "error") {
    return { success: false, error: ERROR_MESSAGES[result.reason] };
  }

  revalidatePath("/cart");
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function removeFromCartAction(cartItemId: string): Promise<CartActionResult> {
  const userId = await requireUserId();
  const result = await removeFromCart(userId, cartItemId);

  if (result.status === "error") {
    return { success: false, error: ERROR_MESSAGES[result.reason] };
  }

  revalidatePath("/cart");
  return { success: true };
}

export async function changeQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const userId = await requireUserId();
  const result = await updateQuantity(userId, cartItemId, quantity);

  if (result.status === "error") {
    return { success: false, error: ERROR_MESSAGES[result.reason] };
  }

  revalidatePath("/cart");
  return { success: true };
}
