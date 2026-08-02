import type { Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";
import { checkPriceAlerts } from "@/services/price-alerts/checkPriceAlerts";
import type { PriceAlertJobPayload } from "@/services/price-alerts/queuePriceAlertCheck";
import { queueNotification } from "@/services/notifications/queueNotification";

/**
 * Ermittelt alle User, die mindestens eine WishlistItem-Position mit
 * gesetztem Zielpreis haben – Kandidaten für einen vollständigen Scan
 * (Payload ohne userId). Reiner Lesezugriff über Prisma, KEINE Änderung
 * an services/wishlist/* (Ticket: "Nicht verändern: Wishlist").
 */
async function getUserIdsWithPriceAlerts(): Promise<string[]> {
  const wishlists = await prisma.wishlist.findMany({
    where: { items: { some: { targetPrice: { not: null } } } },
    select: { userId: true },
  });

  return wishlists.map((wishlist) => wishlist.userId);
}

/**
 * Verarbeitet PRICE_ALERT-Jobs (Feature 58 – Price Alert Queue
 * Integration). Pipeline exakt wie im Ticket vorgegeben:
 *
 *   PRICE_ALERT Job -> checkPriceAlerts() -> queueNotification()
 *
 * `checkPriceAlerts()` (Feature 43) bleibt vollständig unverändert –
 * nur der Ausführungsweg ändert sich (Hintergrund-Job statt
 * synchroner Seitenaufruf). Ausgelöste Alarme werden NICHT mehr direkt
 * als Notification angelegt, sondern ausschließlich über
 * queueNotification() (Feature 57) eingereiht.
 *
 * Fehlt `userId` im Payload, wird für jeden Kandidaten aus
 * getUserIdsWithPriceAlerts() geprüft (vollständiger Scan, siehe
 * queueFullPriceScan.ts). `cardId`/`wishlistItemId` grenzen das
 * Ergebnis von checkPriceAlerts() zusätzlich ein, OHNE checkPriceAlerts()
 * selbst zu verändern.
 *
 * Fehler werden bewusst NICHT abgefangen – ein geworfener Fehler lässt
 * BullMQ den Job als fehlgeschlagen markieren und automatisch mit
 * exponentiellem Backoff erneut versuchen (3 Versuche).
 */
export async function processPriceAlertJob(job: Job): Promise<void> {
  const payload = (job.data ?? {}) as PriceAlertJobPayload;

  console.log(
    `[jobs:price-alerts] Verarbeite Preisalarm-Job (Job ${job.id})` +
      (payload.userId ? ` für User ${payload.userId}.` : " – vollständiger Scan."),
  );

  const userIds = payload.userId ? [payload.userId] : await getUserIdsWithPriceAlerts();

  let triggeredCount = 0;

  for (const userId of userIds) {
    const alerts = await checkPriceAlerts(userId);

    const relevantAlerts = alerts.filter(
      (alert) =>
        (!payload.cardId || alert.cardId === payload.cardId) &&
        (!payload.wishlistItemId || alert.wishlistItemId === payload.wishlistItemId),
    );

    for (const alert of relevantAlerts) {
      await queueNotification({
        userId,
        type: NotificationType.PRICE_ALERT,
        title: `Preisalarm: ${alert.cardName}`,
        message: `${alert.cardName} (${alert.setName}) ist jetzt für ${alert.currentPrice} verfügbar – dein Zielpreis war ${alert.targetPrice}.`,
        link: "/my-price-alerts",
      });
      triggeredCount += 1;
    }
  }

  console.log(
    `[jobs:price-alerts] Preisalarm-Job abgeschlossen (Job ${job.id}): ${userIds.length} User geprüft, ` +
      `${triggeredCount} Alarm(e) ausgelöst.`,
  );
}
