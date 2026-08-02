import type { Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";
import { queueNotification } from "@/services/notifications/queueNotification";

import { getPublicSellerProfile } from "./getPublicSellerProfile";
import { SellerJobType, type SellerJobPayload } from "./queueSeller";

/** Anzeigetext je Ereignistyp – für Notification-Titel/-Nachricht. */
const TYPE_LABEL: Record<SellerJobType, string> = {
  [SellerJobType.PROFILE_UPDATED]: "Profil aktualisiert",
  [SellerJobType.FOLLOWED]: "Neuer Follower",
  [SellerJobType.UNFOLLOWED]: "Follower verloren",
  [SellerJobType.VERIFIED]: "Verkäufer verifiziert",
  [SellerJobType.SHOP_RULES_UPDATED]: "Shop-Regeln aktualisiert",
};

/**
 * Verarbeitet SELLER-Jobs (Feature 63 – Seller Queue Integration). Reine
 * Foundation: lädt das bestehende SellerProfile nur LESEND über das
 * bereits vorhandene getPublicSellerProfile() (Feature 50, lädt direkt
 * per ID, kein Ownership-Aufwand nötig – die Daten sind ohnehin
 * öffentlich) – keine Änderung am Seller, an Followern, an Listings
 * oder an Orders. Löst optional die bereits bestehenden Queue-
 * Integrationen aus: queueNotification() (Feature 57) und
 * queueTemplateEmail() (Feature 56).
 *
 * Empfänger von Notification/E-Mail ist bei allen Typen der Verkäufer
 * selbst (`seller.userId`).
 *
 * UNFOLLOWED ist laut Ticket-Prosatext bewusst NUR mit "optional
 * queueNotification()" beschrieben – ohne E-Mail-Zeile. `sendEmail`
 * wird für diesen Typ daher absichtlich ignoriert, selbst wenn `true`
 * übergeben wird (siehe Bedingung unten).
 *
 * E-Mail-Template: Kein bestehendes Template (orderConfirmation/
 * invoiceCreated/reviewRequest/priceAlert/passwordReset/verifyEmail)
 * passt inhaltlich zu Seller-Profil-Ereignissen – neue Templates sind
 * laut Ticket nicht vorgesehen. `reviewRequest` dient hier als rein
 * mechanischer Platzhalter (analog zum bereits etablierten Muster aus
 * Feature 61/62 für nicht perfekt passende Fälle), damit die Pipeline
 * vollständig verdrahtet ist – der tatsächliche Versandinhalt ist erst
 * relevant, sobald ein künftiges Feature diese Foundation echt nutzt.
 *
 * Fehlerbehandlung exakt wie im Ticket gefordert: KEIN try/catch. Eine
 * ungültige `sellerProfileId` wirft eine Exception – BullMQ markiert
 * den Job dadurch als fehlgeschlagen und übernimmt den Retry (3
 * Versuche, exponentieller Backoff, Feature-55-Defaults).
 */
export async function processSeller(job: Job): Promise<void> {
  const payload = job.data as SellerJobPayload;

  console.log(
    `[jobs:seller] Started Seller Job (Job ${job.id}): sellerProfileId=${payload.sellerProfileId}, type=${payload.type}.`,
  );

  if (!payload.sellerProfileId || !payload.type) {
    throw new Error("Ungültiger Seller-Job: sellerProfileId/type fehlen.");
  }

  const seller = await getPublicSellerProfile(payload.sellerProfileId);

  if (!seller) {
    throw new Error(`Unknown Seller: "${payload.sellerProfileId}"`);
  }

  if (payload.sendNotification) {
    await queueNotification({
      userId: seller.userId,
      type: NotificationType.SYSTEM,
      title: TYPE_LABEL[payload.type],
      message: `${TYPE_LABEL[payload.type]}: ${seller.displayName}.`,
      link: `/seller/${seller.id}`,
    });
  }

  if (payload.sendEmail && payload.type !== SellerJobType.UNFOLLOWED) {
    const recipient = await prisma.user.findUnique({
      where: { id: seller.userId },
      select: { email: true },
    });

    // Kein Wurf, falls der Empfänger nicht (mehr) existiert – "Ungültige
    // sellerProfileId" ist laut Ticket der einzige explizit geforderte
    // Fehlerfall; ein fehlender E-Mail-Empfänger überspringt den Versand still.
    if (recipient) {
      const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "";

      await queueTemplateEmail({
        template: "reviewRequest",
        to: recipient.email,
        data: {
          buyerName: seller.displayName,
          sellerName: "Project Atlas",
          orderId: seller.id,
          reviewUrl: `${baseUrl}/seller/${seller.id}`,
        },
      });
    }
  }

  console.log(`[jobs:seller] Finished Seller Job (Job ${job.id}).`);
}
