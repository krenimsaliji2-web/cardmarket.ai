"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateListingSchema } from "@/lib/validation/listing";
import { ListingNotFoundError, updateListing } from "@/services/listing/updateListing";

export interface UpdateListingFormState {
  errors: {
    price?: string;
    quantity?: string;
    language?: string;
    condition?: string;
    description?: string;
    edition?: string;
    grading?: string;
    form?: string;
  };
}

export async function updateListingAction(
  listingId: string,
  formData: FormData,
): Promise<UpdateListingFormState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!sellerProfile) {
    redirect("/seller");
  }

  const rawDescription = formData.get("description");
  const rawEdition = formData.get("edition");
  const rawGrading = formData.get("grading");

  const fieldsResult = updateListingSchema.safeParse({
    price: String(formData.get("price") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    language: String(formData.get("language") ?? ""),
    condition: String(formData.get("condition") ?? ""),
    isFoil: formData.get("isFoil") === "true",
    isSigned: formData.get("isSigned") === "true",
    description:
      typeof rawDescription === "string" && rawDescription.trim() !== ""
        ? rawDescription
        : undefined,
    edition:
      typeof rawEdition === "string" && rawEdition.trim() !== "" ? rawEdition : undefined,
    isFirstEdition: formData.get("isFirstEdition") === "true",
    grading:
      typeof rawGrading === "string" && rawGrading.trim() !== "" ? rawGrading : undefined,
  });

  if (!fieldsResult.success) {
    const errors: UpdateListingFormState["errors"] = {};
    for (const issue of fieldsResult.error.issues) {
      const key = issue.path[0] as keyof UpdateListingFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { errors };
  }

  try {
    await updateListing({
      listingId,
      sellerId: sellerProfile.id,
      price: fieldsResult.data.price,
      quantity: fieldsResult.data.quantity,
      language: fieldsResult.data.language,
      condition: fieldsResult.data.condition,
      isFoil: fieldsResult.data.isFoil,
      isSigned: fieldsResult.data.isSigned,
      description: fieldsResult.data.description,
      edition: fieldsResult.data.edition,
      isFirstEdition: fieldsResult.data.isFirstEdition,
      grading: fieldsResult.data.grading,
    });
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      redirect("/seller");
    }
    throw error;
  }

  redirect("/seller");
}
