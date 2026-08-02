"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createConversation } from "@/services/messages/createConversation";

export interface StartConversationResult {
  success: boolean;
  error?: string;
}

/**
 * Startet (oder öffnet einen bereits bestehenden) Chat mit dem Verkäufer
 * dieses Listings. `buyerId` kommt ausschließlich aus der Server-Session.
 * Nutzt denselben services/messages/createConversation.ts wie der
 * "Nachricht senden"-Button auf der Verkäuferprofilseite (kein Duplikat
 * der Anlegen-oder-Wiederverwenden-Logik).
 */
export async function startConversationFromListingAction(
  listingId: string,
): Promise<StartConversationResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing) {
    return { success: false, error: "Dieses Angebot existiert nicht mehr." };
  }

  const result = await createConversation({
    buyerId: session.user.id,
    sellerId: listing.sellerId,
    listingId,
  });

  if (result.status === "self") {
    return { success: false, error: "Du kannst dir selbst keine Nachricht senden." };
  }

  redirect(`/messages/${result.id}`);
}
