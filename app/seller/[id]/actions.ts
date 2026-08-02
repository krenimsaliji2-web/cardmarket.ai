"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { listingImageFileSchema } from "@/lib/validation/listingImages";
import { updateSellerProfileSchema } from "@/lib/validation/sellerProfile";
import { followSeller } from "@/services/follow/followSeller";
import { unfollowSeller } from "@/services/follow/unfollowSeller";
import { createConversation } from "@/services/messages/createConversation";
import { createStorageProvider } from "@/services/storage";
import { updateSellerProfile } from "@/services/seller/updateSellerProfile";

export interface SellerProfileEditFormState {
  success: boolean;
  errors: {
    shortDescription?: string;
    longDescription?: string;
    companyName?: string;
    website?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
    discordUrl?: string;
    location?: string;
    shippingCountries?: string;
    shippingTime?: string;
    responseTime?: string;
    shopRules?: string;
    returnPolicy?: string;
    bannerImage?: string;
    avatar?: string;
    form?: string;
  };
}

/**
 * Nur der eingeloggte Verkäufer selbst darf sein Profil bearbeiten – der
 * Ownership-Check erfolgt strukturell in updateSellerProfile() (Suche
 * ausschließlich über session.user.id, nie über eine übergebene
 * SellerProfile-ID). `sellerId` wird hier nur für revalidatePath()
 * benötigt, nicht zur Autorisierung.
 */
export async function updateSellerProfileAction(
  _prevState: SellerProfileEditFormState,
  formData: FormData,
): Promise<SellerProfileEditFormState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sellerId = String(formData.get("sellerId") ?? "");

  const rawShippingCountries = String(formData.get("shippingCountries") ?? "");
  const shippingCountries = rawShippingCountries
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const fieldsResult = updateSellerProfileSchema.safeParse({
    shortDescription: String(formData.get("shortDescription") ?? ""),
    longDescription: String(formData.get("longDescription") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    website: String(formData.get("website") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    facebookUrl: String(formData.get("facebookUrl") ?? ""),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    discordUrl: String(formData.get("discordUrl") ?? ""),
    location: String(formData.get("location") ?? ""),
    shippingCountries,
    shippingTime: String(formData.get("shippingTime") ?? ""),
    responseTime: String(formData.get("responseTime") ?? ""),
    shopRules: String(formData.get("shopRules") ?? ""),
    returnPolicy: String(formData.get("returnPolicy") ?? ""),
  });

  const bannerImageEntry = formData.get("bannerImage");
  const bannerImageFile =
    bannerImageEntry instanceof File && bannerImageEntry.size > 0 ? bannerImageEntry : undefined;
  const avatarEntry = formData.get("avatar");
  const avatarFile = avatarEntry instanceof File && avatarEntry.size > 0 ? avatarEntry : undefined;

  const errors: SellerProfileEditFormState["errors"] = {};

  if (!fieldsResult.success) {
    for (const issue of fieldsResult.error.issues) {
      const key = issue.path[0] as keyof SellerProfileEditFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  if (bannerImageFile) {
    const bannerResult = listingImageFileSchema.safeParse(bannerImageFile);
    if (!bannerResult.success) {
      errors.bannerImage = bannerResult.error.issues[0]?.message ?? "Ungültiges Bannerbild.";
    }
  }
  if (avatarFile) {
    const avatarResult = listingImageFileSchema.safeParse(avatarFile);
    if (!avatarResult.success) {
      errors.avatar = avatarResult.error.issues[0]?.message ?? "Ungültiges Profilbild.";
    }
  }

  if (!fieldsResult.success || Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Storage-Provider wird hier (Composition Root) erzeugt und in den Service
  // injiziert – die Server Action selbst schreibt niemals direkt Dateien.
  const storageProvider = createStorageProvider();

  const result = await updateSellerProfile(
    session.user.id,
    {
      bannerImageFile,
      avatarFile,
      ...fieldsResult.data,
    },
    storageProvider,
  );

  if (result.status === "not_found") {
    return {
      success: false,
      errors: { form: "Du besitzt kein Verkäuferprofil." },
    };
  }

  revalidatePath(`/seller/${sellerId}`);
  return { success: true, errors: {} };
}

export interface StartConversationResult {
  success: boolean;
  error?: string;
}

/**
 * Startet (oder öffnet einen bereits bestehenden) Chat mit diesem
 * Verkäufer. Nutzt denselben services/messages/createConversation.ts wie
 * der "Nachricht senden"-Button auf der Listing-Seite (kein Duplikat der
 * Anlegen-oder-Wiederverwenden-Logik).
 */
export async function startConversationFromSellerProfileAction(
  sellerId: string,
): Promise<StartConversationResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const result = await createConversation({ buyerId: session.user.id, sellerId });

  if (result.status === "self") {
    return { success: false, error: "Du kannst dir selbst keine Nachricht senden." };
  }

  redirect(`/messages/${result.id}`);
}

export interface FollowActionResult {
  success: boolean;
  error?: string;
}

/**
 * `followerId` kommt ausschließlich aus der Server-Session, niemals aus
 * Client-Eingaben – niemand kann im Namen eines anderen Users folgen.
 */
export async function followSellerAction(sellerId: string): Promise<FollowActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const result = await followSeller(session.user.id, sellerId);

  if (result.status === "self") {
    return { success: false, error: "Du kannst deinem eigenen Shop nicht folgen." };
  }
  if (result.status === "seller_not_found") {
    return { success: false, error: "Dieser Verkäufer wurde nicht gefunden." };
  }

  revalidatePath(`/seller/${sellerId}`);
  revalidatePath("/my-following");
  return { success: true };
}

export async function unfollowSellerAction(sellerId: string): Promise<FollowActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  await unfollowSeller(session.user.id, sellerId);

  revalidatePath(`/seller/${sellerId}`);
  revalidatePath("/my-following");
  return { success: true };
}
