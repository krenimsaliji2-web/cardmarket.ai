import { prisma } from "@/lib/prisma";

export type MarkNotificationAsReadResult = { status: "updated" } | { status: "not_found" };

/**
 * Markiert eine einzelne Benachrichtigung als gelesen. Ownership-Check
 * direkt in der Query (id + userId), gleiches Muster wie
 * services/collection/updateCollectionItem.ts.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<MarkNotificationAsReadResult> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    return { status: "not_found" };
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });

  return { status: "updated" };
}
