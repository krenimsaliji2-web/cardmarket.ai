"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { deleteNotification } from "@/services/notifications/deleteNotification";
import { markAllNotificationsAsRead } from "@/services/notifications/markAllNotificationsAsRead";
import { markNotificationAsRead } from "@/services/notifications/markNotificationAsRead";

export interface NotificationActionResult {
  success: boolean;
  error?: string;
}

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

export async function markNotificationAsReadAction(
  notificationId: string,
): Promise<NotificationActionResult> {
  const userId = await requireUserId();
  const result = await markNotificationAsRead(notificationId, userId);

  if (result.status === "not_found") {
    return { success: false, error: "Diese Benachrichtigung wurde nicht gefunden." };
  }

  revalidatePath("/my-notifications");
  return { success: true };
}

export async function markAllNotificationsAsReadAction(): Promise<NotificationActionResult> {
  const userId = await requireUserId();
  await markAllNotificationsAsRead(userId);

  revalidatePath("/my-notifications");
  return { success: true };
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<NotificationActionResult> {
  const userId = await requireUserId();
  const result = await deleteNotification(notificationId, userId);

  if (result.status === "not_found") {
    return { success: false, error: "Diese Benachrichtigung wurde nicht gefunden." };
  }

  revalidatePath("/my-notifications");
  return { success: true };
}
