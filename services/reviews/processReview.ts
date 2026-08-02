import type { Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { queueTemplateEmail } from "@/services/email/queueTemplateEmail";
import { queueNotification } from "@/services/notifications/queueNotification";

import type { ReviewJobPayload } from "./queueReview";

/**
 * Verarbeitet REVIEW-Jobs (Feature 61 – Review Queue Integration). Reine
 * Foundation: lädt die bestehende Review nur LESEND (keine Änderung an
 * ihr, kein neues Datenmodell) und löst optional die bereits
 * bestehenden Queue-Integrationen aus – queueNotification() (Feature
 * 57) und queueTemplateEmail() (Feature 56). Die eigentliche Review-
 * Logik (services/reviews/{createReview,getReview}.ts) bleibt
 * unangetastet und wird hier bewusst NICHT wiederverwendet, da sie
 * ausschließlich per (orderId, sellerId, buyerId) statt per `id` lädt.
 *
 * Für die E-Mail wird laut Ticket "Keine neuen Templates" das bereits
 * bestehende `reviewRequest`-Template verwendet (der einzige Review-
 * bezogene Template-Kandidat) – eine künftige, konkrete Verwendung
 * dieser Foundation kann bei Bedarf ein passenderes Template wählen.
 *
 * Fehlerbehandlung exakt wie im Ticket gefordert: KEIN try/catch. Eine
 * ungültige `reviewId` wirft eine Exception – BullMQ markiert den Job
 * dadurch als fehlgeschlagen und übernimmt den Retry (3 Versuche,
 * exponentieller Backoff, Feature-55-Defaults).
 */
export async function processReview(job: Job): Promise<void> {
  const payload = job.data as ReviewJobPayload;

  console.log(
    `[jobs:review] Started Review Job (Job ${job.id}): reviewId=${payload.reviewId}, userId=${payload.userId}.`,
  );

  if (!payload.reviewId || !payload.userId || !payload.sellerProfileId) {
    throw new Error("Ungültiger Review-Job: reviewId/userId/sellerProfileId fehlen.");
  }

  const review = await prisma.review.findUnique({
    where: { id: payload.reviewId },
    select: {
      id: true,
      rating: true,
      comment: true,
      orderId: true,
      buyer: { select: { name: true } },
      seller: { select: { displayName: true } },
    },
  });

  if (!review) {
    throw new Error(`Unknown Review: "${payload.reviewId}"`);
  }

  if (payload.sendNotification) {
    await queueNotification({
      userId: payload.userId,
      type: NotificationType.REVIEW,
      title: `Bewertung: ${review.rating} / 5`,
      message: review.comment ?? `Bewertung mit ${review.rating} von 5 Sternen erhalten.`,
      link: `/orders/${review.orderId}/review`,
    });
  }

  if (payload.sendEmail) {
    const recipient = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true },
    });

    // Kein Wurf, falls der Empfänger nicht (mehr) existiert – "Ungültige
    // reviewId" ist laut Ticket der einzige explizit geforderte Fehlerfall;
    // ein fehlender E-Mail-Empfänger überspringt den Versand still.
    if (recipient) {
      const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "";

      await queueTemplateEmail({
        template: "reviewRequest",
        to: recipient.email,
        data: {
          buyerName: review.buyer.name,
          sellerName: review.seller.displayName,
          orderId: review.orderId,
          reviewUrl: `${baseUrl}/orders/${review.orderId}/review`,
        },
      });
    }
  }

  console.log(`[jobs:review] Finished Review Job (Job ${job.id}).`);
}
