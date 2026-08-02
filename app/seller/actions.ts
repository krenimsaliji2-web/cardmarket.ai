"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingNotFoundError } from "@/services/listing/errors";
import { deleteListing } from "@/services/listing/deleteListing";
import { toggleListingActive } from "@/services/listing/toggleListingActive";
import { createStorageProvider } from "@/services/storage";

export interface ListingActionResult {
  success: boolean;
  error?: string;
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

export async function toggleListingActiveAction(
  listingId: string,
): Promise<ListingActionResult> {
  const sellerId = await getAuthorizedSellerId();

  try {
    await toggleListingActive(listingId, sellerId);
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/seller");
  return { success: true };
}

export async function deleteListingAction(
  listingId: string,
): Promise<ListingActionResult> {
  const sellerId = await getAuthorizedSellerId();

  try {
    await deleteListing(listingId, sellerId, createStorageProvider());
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/seller");
  return { success: true };
}
