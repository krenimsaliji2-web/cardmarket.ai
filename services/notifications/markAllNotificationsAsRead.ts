import { prisma } from "@/lib/prisma";

export interface MarkAllNotificationsAsReadResult {
  updatedCount: number;
}

/** Markiert alle ungelesenen Benachrichtigungen eines Users als gelesen. */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<MarkAllNotificationsAsReadResult> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
}
