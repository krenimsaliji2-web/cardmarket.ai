"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Role } from "@/prisma/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ListingNotFoundError } from "@/services/listing/errors";
import { toggleListingActiveAsAdmin } from "@/services/listing/toggleListingActive";

export interface AdminListingActionResult {
  success: boolean;
  error?: string;
}

/**
 * Wie app/admin/reports/actions.ts: kein Redirect bei fehlender Session
 * oder fehlender Admin-Rolle, sondern notFound() – "Nicht-Admins erhalten
 * 404. Kein Redirect." gilt konsistent für alle Admin-Actions.
 */
async function requireAdminUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== Role.ADMIN) {
    notFound();
  }

  return session.user.id;
}

/**
 * Admin-seitiges Deaktivieren/Reaktivieren (Feature 78 – Moderation).
 * Ruft ausschließlich die bestehende, erweiterte
 * toggleListingActiveAsAdmin() auf (services/listing/toggleListingActive.ts)
 * – keine eigene Businesslogik in dieser Action.
 */
export async function toggleListingActiveAsAdminAction(
  listingId: string,
): Promise<AdminListingActionResult> {
  await requireAdminUserId();

  try {
    await toggleListingActiveAsAdmin(listingId);
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/listings");
  return { success: true };
}
