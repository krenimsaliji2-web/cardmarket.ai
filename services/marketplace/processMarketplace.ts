import type { Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";
import { queueNotification } from "@/services/notifications/queueNotification";

import { MarketplaceJobType, type MarketplaceJobPayload } from "./queueMarketplace";

/** Anzeigetext je Ereignistyp – für Notification-Titel/-Nachricht. */
const TYPE_LABEL: Record<MarketplaceJobType, string> = {
  [MarketplaceJobType.LISTING_CREATED]: "Listing erstellt",
  [MarketplaceJobType.LISTING_UPDATED]: "Listing aktualisiert",
  [MarketplaceJobType.LISTING_DEACTIVATED]: "Listing deaktiviert",
  [MarketplaceJobType.LISTING_SOLD]: "Listing verkauft",
  [MarketplaceJobType.FEATURED]: "Listing hervorgehoben",
};

/**
 * Verarbeitet MARKETPLACE-Jobs (Feature 64 – Marketplace Queue
 * Integration). Reine Foundation: lädt das bestehende Listing nur
 * LESEND. Es existiert keine bereits vorhandene, wiederverwendbare
 * "Listing per ID laden"-Service-Funktion (app/listings/[id]/page.tsx
 * definiert seine Ladefunktion privat/seitengebunden) – die Abfrage
 * hier ist daher eine neue, eigenständige, minimale Query, keine
 * Duplizierung bestehender Logik. Keine Änderung an Listing/Marketplace/
 * Search/Orders. Löst optional die bereits bestehenden Queue-
 * Integrationen aus: queueNotification() (Feature 57) und
 * queueTemplateEmail() (Feature 56).
 *
 * Empfänger von Notification/E-Mail ist bei allen Typen der Verkäufer
 * des Listings (`listing.seller.userId`).
 *
 * LISTING_DEACTIVATED ist laut Ticket-Prosatext bewusst NUR mit
 * "optional queueNotification()" beschrieben – ohne E-Mail-Zeile.
 * `sendEmail` wird für diesen Typ daher absichtlich ignoriert, selbst
 * wenn `true` übergeben wird (siehe Bedingung unten) – analog zur
 * UNFOLLOWED-Sonderregel aus Feature 63.
 *
 * E-Mail-Template: Kein bestehendes Template (orderConfirmation/
 * invoiceCreated/reviewRequest/priceAlert/passwordReset/verifyEmail)
 * passt inhaltlich zu Marketplace-Listing-Ereignissen – neue Templates
 * sind laut Ticket nicht vorgesehen. `reviewRequest` dient hier als
 * rein mechanischer Platzhalter (analog zum bereits etablierten Muster
 * aus Feature 61/62/63), damit die Pipeline vollständig verdrahtet ist.
 *
 * Fehlerbehandlung exakt wie im Ticket gefordert: KEIN try/catch. Eine
 * ungültige `listingId` wirft eine Exception – BullMQ markiert den Job
 * dadurch als fehlgeschlagen und übernimmt den Retry (3 Versuche,
 * exponentieller Backoff, Feature-55-Defaults).
 */
export async function processMarketplace(job: Job): Promise<void> {
  const payload = job.data as MarketplaceJobPayload;

  console.log(
    `[jobs:marketplace] Started Marketplace Job (Job ${job.id}): listingId=${payload.listingId}, type=${payload.type}.`,
  );

  if (!payload.listingId || !payload.type) {
    throw new Error("Ungültiger Marketplace-Job: listingId/type fehlen.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: payload.listingId },
    select: {
      id: true,
      price: true,
      card: { select: { name: true } },
      seller: { select: { userId: true, displayName: true } },
    },
  });

  if (!listing) {
    throw new Error(`Unknown Listing: "${payload.listingId}"`);
  }

  if (payload.sendNotification) {
    await queueNotification({
      userId: listing.seller.userId,
      type: NotificationType.SYSTEM,
      title: TYPE_LABEL[payload.type],
      message: `${TYPE_LABEL[payload.type]}: ${listing.card.name}.`,
      link: `/listings/${listing.id}`,
    });
  }

  if (payload.sendEmail && payload.type !== MarketplaceJobType.LISTING_DEACTIVATED) {
    const recipient = await prisma.user.findUnique({
      where: { id: listing.seller.userId },
      select: { email: true },
    });

    // Kein Wurf, falls der Empfänger nicht (mehr) existiert – "Ungültige
    // listingId" ist laut Ticket der einzige explizit geforderte
    // Fehlerfall; ein fehlender E-Mail-Empfänger überspringt den Versand still.
    if (recipient) {
      const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "";

      await queueTemplateEmail({
        template: "reviewRequest",
        to: recipient.email,
        data: {
          buyerName: listing.seller.displayName,
          sellerName: "Project Atlas",
          orderId: listing.id,
          reviewUrl: `${baseUrl}/listings/${listing.id}`,
        },
      });
    }
  }

  console.log(`[jobs:marketplace] Finished Marketplace Job (Job ${job.id}).`);
}
