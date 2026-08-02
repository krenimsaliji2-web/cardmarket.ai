import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/prisma/generated/prisma/client";

export interface NotificationResult {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface GetNotificationsOptions {
  page?: number;
  pageSize?: number;
}

export interface GetNotificationsResult {
  items: NotificationResult[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt die Benachrichtigungen eines Users, neueste zuerst, echte
 * DB-seitige Pagination (skip/take + count) – Notifications können sich
 * über die Zeit auf sehr viele Zeilen summieren, anders als z. B.
 * Collection/Wishlist, daher hier (wie bei searchCards.ts, Feature 37)
 * bewusst kein "alles laden + in JS paginieren".
 */
export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {},
): Promise<GetNotificationsResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { items, total, page, pageSize };
}
