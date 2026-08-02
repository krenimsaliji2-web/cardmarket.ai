import { prisma } from "@/lib/prisma";

/** Zählt die ungelesenen Benachrichtigungen eines Users. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
