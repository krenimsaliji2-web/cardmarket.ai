import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/prisma/generated/prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface CreateNotificationResult {
  id: string;
}

/**
 * Legt eine In-App-Benachrichtigung an. Dies ist die EINZIGE Stelle, über
 * die zukünftige Features (Orders, Reviews, Price Alerts, ...) Benach-
 * richtigungen erzeugen sollen – siehe Feature-Ziel "Alle zukünftigen
 * Features sollen darüber Benachrichtigungen erzeugen können". Dieses
 * Feature selbst ruft diese Funktion an keiner Stelle automatisch auf
 * (reine Foundation, keine bestehenden Features werden angebunden).
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
    select: { id: true },
  });
}

export { NotificationType };
