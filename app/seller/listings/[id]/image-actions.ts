"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  newListingImagesSchema,
  reorderImageIdsSchema,
} from "@/lib/validation/listingImages";
import { ListingNotFoundError } from "@/services/listing/errors";
import {
  addListingImages,
  deleteListingImage,
  getListingImages,
  ListingImageNotFoundError,
  reorderListingImages,
  setPrimaryListingImage,
  TooManyImagesError,
} from "@/services/listing/images";
import { createStorageProvider } from "@/services/storage";

export interface ListingImageActionResult {
  success: boolean;
  error?: string;
  images?: { id: string; url: string; sortOrder: number; isPrimary: boolean }[];
}

async function getAuthorizedSellerId(): Promise<string> {
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

  return sellerProfile.id;
}

/** Nach jeder Bildänderung betroffene Seiten neu validieren: Bearbeiten-Formular, Seller-Übersicht, öffentliche Listing-Seite. */
function revalidateListingPages(listingId: string): void {
  revalidatePath(`/seller/listings/${listingId}`);
  revalidatePath("/seller");
  revalidatePath(`/listings/${listingId}`);
}

/** Lädt weitere Bilder zu einem bestehenden Listing hoch ("Nachträglicher Upload"). */
export async function uploadListingImagesAction(
  listingId: string,
  formData: FormData,
): Promise<ListingImageActionResult> {
  const sellerId = await getAuthorizedSellerId();

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const filesResult = newListingImagesSchema.safeParse(files);
  if (!filesResult.success) {
    return {
      success: false,
      error: filesResult.error.issues[0]?.message ?? "Ungültige Bilder.",
    };
  }

  if (filesResult.data.length === 0) {
    return { success: false, error: "Bitte wähle mindestens ein Bild aus." };
  }

  try {
    const images = await addListingImages(
      listingId,
      sellerId,
      filesResult.data,
      createStorageProvider(),
    );
    revalidateListingPages(listingId);
    return { success: true, images };
  } catch (error) {
    if (error instanceof ListingNotFoundError || error instanceof TooManyImagesError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/** Löscht ein einzelnes Bild eines Listings. */
export async function deleteListingImageAction(
  listingId: string,
  imageId: string,
): Promise<ListingImageActionResult> {
  const sellerId = await getAuthorizedSellerId();

  try {
    const images = await deleteListingImage(
      listingId,
      sellerId,
      imageId,
      createStorageProvider(),
    );
    revalidateListingPages(listingId);
    return { success: true, images };
  } catch (error) {
    if (error instanceof ListingNotFoundError || error instanceof ListingImageNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/** Markiert ein bestehendes Bild als Hauptbild – unabhängig von der Anzeigereihenfolge. */
export async function setPrimaryListingImageAction(
  listingId: string,
  imageId: string,
): Promise<ListingImageActionResult> {
  const sellerId = await getAuthorizedSellerId();

  try {
    const images = await setPrimaryListingImage(listingId, sellerId, imageId);
    revalidateListingPages(listingId);
    return { success: true, images };
  } catch (error) {
    if (error instanceof ListingNotFoundError || error instanceof ListingImageNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/** Setzt die Anzeigereihenfolge aller Bilder eines Listings neu. */
export async function reorderListingImagesAction(
  listingId: string,
  orderedImageIds: string[],
): Promise<ListingImageActionResult> {
  const sellerId = await getAuthorizedSellerId();

  const idsResult = reorderImageIdsSchema.safeParse(orderedImageIds);
  if (!idsResult.success) {
    return {
      success: false,
      error: idsResult.error.issues[0]?.message ?? "Ungültige Reihenfolge.",
    };
  }

  try {
    const images = await reorderListingImages(listingId, sellerId, idsResult.data);
    revalidateListingPages(listingId);
    return { success: true, images };
  } catch (error) {
    if (error instanceof ListingNotFoundError || error instanceof ListingImageNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/** Liefert alle Bilder eines Listings in Anzeigereihenfolge (Ownership-geprüft). */
export async function getListingImagesAction(
  listingId: string,
): Promise<ListingImageActionResult> {
  const sellerId = await getAuthorizedSellerId();

  try {
    const images = await getListingImages(listingId, sellerId);
    return { success: true, images };
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
