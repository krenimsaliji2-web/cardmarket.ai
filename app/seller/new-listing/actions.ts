"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/validation/listing";
import { listingImagesSchema } from "@/lib/validation/listingImages";
import { createListing } from "@/services/listing/createListing";
import {
  searchCards as searchCardsService,
  type CardSearchResult,
} from "@/services/listing/searchCards";
import { createStorageProvider } from "@/services/storage";

/** Wird direkt (nicht formulargebunden) aus der Client-Komponente aufgerufen, während getippt wird. */
export async function searchCards(query: string): Promise<CardSearchResult[]> {
  return searchCardsService(query);
}

export interface ListingFormState {
  errors: {
    cardId?: string;
    price?: string;
    quantity?: string;
    language?: string;
    condition?: string;
    description?: string;
    edition?: string;
    grading?: string;
    images?: string;
    form?: string;
  };
}

export async function createListingAction(
  _prevState: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
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

  const fieldsResult = createListingSchema.safeParse({
    cardId: String(formData.get("cardId") ?? ""),
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

  const imageFiles = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const imagesResult = listingImagesSchema.safeParse(imageFiles);

  const errors: ListingFormState["errors"] = {};

  if (!fieldsResult.success) {
    for (const issue of fieldsResult.error.issues) {
      const key = issue.path[0] as keyof ListingFormState["errors"];
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  if (!imagesResult.success) {
    errors.images = imagesResult.error.issues[0]?.message ?? "Ungültige Bilder.";
  }

  if (!fieldsResult.success || !imagesResult.success) {
    return { errors };
  }

  const card = await prisma.card.findUnique({
    where: { id: fieldsResult.data.cardId },
    select: { id: true },
  });

  if (!card) {
    return {
      errors: { cardId: "Diese Karte existiert nicht mehr. Bitte wähle erneut." },
    };
  }

  // Storage-Provider wird hier (Composition Root) erzeugt und in den Service
  // injiziert – die Server Action selbst schreibt niemals direkt Dateien.
  const storageProvider = createStorageProvider();

  await createListing(
    {
      sellerId: sellerProfile.id,
      cardId: fieldsResult.data.cardId,
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
      images: imagesResult.data,
    },
    storageProvider,
  );

  redirect("/seller");
}
