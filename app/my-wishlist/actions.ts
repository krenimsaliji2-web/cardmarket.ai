"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { updateWishlistItemSchema } from "@/lib/validation/wishlistItem";
import { addToWishlist } from "@/services/wishlist/addToWishlist";
import { getWishlistItemByVariant } from "@/services/wishlist/getWishlistItemByVariant";
import { removeFromWishlist } from "@/services/wishlist/removeFromWishlist";
import { updateWishlistItem } from "@/services/wishlist/updateWishlistItem";

export interface UpdateWishlistItemFormState {
  errors: {
    language?: string;
    condition?: string;
    targetPrice?: string;
    notes?: string;
    general?: string;
  };
  success?: boolean;
}

export interface WishlistActionResult {
  success: boolean;
  error?: string;
}

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

export interface ToggleFavoriteResult {
  success: boolean;
  favorited: boolean;
  error?: string;
}

/**
 * Herzsymbol-Toggle (Feature 77 – Favoriten). Wiederverwendet ausschließlich
 * bestehende Wishlist-Funktionen (kein neues Datenmodell, keine neue
 * Architektur, siehe Ticket): prüft über getWishlistItemByVariant(), ob die
 * exakte Variante (Karte + Sprache + Zustand + Foil) bereits existiert –
 * falls ja, wird sie entfernt (removeFromWishlist()), falls nein,
 * hinzugefügt (addToWishlist()). "Favorit" ist damit technisch identisch
 * zu einem WishlistItem ohne Zielpreis/Notizen.
 */
export async function toggleFavoriteAction(
  cardId: string,
  language: string,
  condition: string,
  foil: boolean,
): Promise<ToggleFavoriteResult> {
  const userId = await requireUserId();

  const existing = await getWishlistItemByVariant(userId, { cardId, language, condition, foil });

  if (existing) {
    const result = await removeFromWishlist(existing.id, userId);
    if (result.status === "not_found") {
      return { success: false, favorited: true, error: "Favorit wurde nicht gefunden." };
    }
    revalidatePath("/my-wishlist");
    return { success: true, favorited: false };
  }

  await addToWishlist({ userId, cardId, language, condition, foil });
  revalidatePath("/my-wishlist");
  return { success: true, favorited: true };
}

export async function updateWishlistItemAction(
  _prevState: UpdateWishlistItemFormState,
  formData: FormData,
): Promise<UpdateWishlistItemFormState> {
  const userId = await requireUserId();

  const itemId = String(formData.get("itemId") ?? "");
  const rawTargetPrice = formData.get("targetPrice");
  const rawNotes = formData.get("notes");

  const result = updateWishlistItemSchema.safeParse({
    language: String(formData.get("language") ?? ""),
    condition: String(formData.get("condition") ?? ""),
    foil: formData.get("foil") === "on",
    targetPrice:
      typeof rawTargetPrice === "string" && rawTargetPrice.trim() !== ""
        ? rawTargetPrice
        : undefined,
    notes: typeof rawNotes === "string" && rawNotes.trim() !== "" ? rawNotes : undefined,
  });

  if (!result.success) {
    const errors: UpdateWishlistItemFormState["errors"] = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof UpdateWishlistItemFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { errors };
  }

  const updateResult = await updateWishlistItem(itemId, userId, {
    language: result.data.language,
    condition: result.data.condition,
    foil: result.data.foil,
    targetPrice: result.data.targetPrice ?? null,
    notes: result.data.notes ?? null,
  });

  if (updateResult.status === "not_found") {
    return { errors: { general: "Dieser Wunschlisten-Eintrag wurde nicht gefunden." } };
  }

  revalidatePath("/my-wishlist");
  return { errors: {}, success: true };
}

export async function removeFromWishlistAction(itemId: string): Promise<WishlistActionResult> {
  const userId = await requireUserId();
  const result = await removeFromWishlist(itemId, userId);

  if (result.status === "not_found") {
    return { success: false, error: "Dieser Wunschlisten-Eintrag wurde nicht gefunden." };
  }

  revalidatePath("/my-wishlist");
  return { success: true };
}
