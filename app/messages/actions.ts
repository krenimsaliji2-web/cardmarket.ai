"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { deleteConversation } from "@/services/messages/deleteConversation";
import { markMessagesRead } from "@/services/messages/markMessagesRead";
import { sendMessage } from "@/services/messages/sendMessage";

export interface MessageActionResult {
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

/**
 * `senderId` kommt ausschließlich aus der Server-Session, niemals aus
 * Client-Eingaben – so kann niemand Nachrichten im Namen eines anderen
 * Users verschicken.
 */
export async function sendMessageAction(
  conversationId: string,
  message: string,
): Promise<MessageActionResult> {
  const userId = await requireUserId();

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { success: false, error: "Die Nachricht darf nicht leer sein." };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "Die Nachricht darf maximal 2000 Zeichen lang sein." };
  }

  const result = await sendMessage({ conversationId, senderId: userId, message: trimmed });

  if (result.status === "not_participant") {
    return { success: false, error: "Dieser Chat wurde nicht gefunden." };
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { success: true };
}

export async function markAsReadAction(conversationId: string): Promise<MessageActionResult> {
  const userId = await requireUserId();
  const result = await markMessagesRead(conversationId, userId);

  if (result.status === "not_participant") {
    return { success: false, error: "Dieser Chat wurde nicht gefunden." };
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function deleteConversationAction(conversationId: string): Promise<MessageActionResult> {
  const userId = await requireUserId();
  const result = await deleteConversation(conversationId, userId);

  if (result.status === "not_participant") {
    return { success: false, error: "Dieser Chat wurde nicht gefunden." };
  }

  revalidatePath("/messages");
  return { success: true };
}
