import { prisma } from "@/lib/prisma";

export type MarkMessagesReadResult =
  | { status: "updated"; count: number }
  | { status: "not_participant" };

/**
 * Markiert alle EMPFANGENEN (nicht: eigenen gesendeten) Nachrichten einer
 * Conversation als gelesen. Ownership-Check wie in sendMessage.ts – nicht
 * Teilnehmer und nicht existent liefern beide `not_participant`.
 */
export async function markMessagesRead(
  conversationId: string,
  userId: string,
): Promise<MarkMessagesReadResult> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, seller: { select: { userId: true } } },
  });

  if (!conversation) {
    return { status: "not_participant" };
  }

  const isParticipant =
    conversation.buyerId === userId || conversation.seller.userId === userId;

  if (!isParticipant) {
    return { status: "not_participant" };
  }

  const result = await prisma.message.updateMany({
    where: { conversationId, isRead: false, senderId: { not: userId } },
    data: { isRead: true },
  });

  return { status: "updated", count: result.count };
}
