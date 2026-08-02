"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createSellerProfileSchema } from "@/lib/validation/sellerProfile";
import { createSellerProfile } from "@/services/seller/createSellerProfile";

export interface SellerProfileFormState {
  errors: {
    displayName?: string;
    country?: string;
    bio?: string;
  };
}

export async function createSellerProfileAction(
  _prevState: SellerProfileFormState,
  formData: FormData,
): Promise<SellerProfileFormState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const rawBio = formData.get("bio");

  const result = createSellerProfileSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    country: String(formData.get("country") ?? ""),
    bio: typeof rawBio === "string" && rawBio.trim() !== "" ? rawBio : undefined,
  });

  if (!result.success) {
    const errors: SellerProfileFormState["errors"] = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof SellerProfileFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { errors };
  }

  await createSellerProfile({
    userId: session.user.id,
    displayName: result.data.displayName,
    country: result.data.country,
    bio: result.data.bio,
  });

  redirect("/seller");
}
