import { prisma } from "@/lib/prisma";

export type DeleteNotificationResult = { status: "deleted" } | { status: "not_found" };

/**
 * Löscht eine einzelne Benachrichtigung. Ownership-Check direkt in der
 * Query, gleiches Muster wie services/collection/removeFromCollection.ts.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<DeleteNotificationResult> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    return { status: "not_found" };
  }

  await prisma.notification.delete({ where: { id: notification.id } });
  return { status: "deleted" };
}
