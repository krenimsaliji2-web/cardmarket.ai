import { prisma } from "@/lib/prisma";

export type DeleteConversationResult =
  | { status: "deleted" }
  | { status: "not_participant" };

/**
 * Soft Delete: blendet den Chat nur aus der Liste des AUFRUFENDEN
 * Teilnehmers aus (setzt dessen `deletedByBuyerAt`/`deletedBySellerAt`),
 * siehe Schema-Kommentar bei Conversation. Der jeweils andere Teilnehmer
 * behält seinen Zugriff (getConversation.ts) und seinen Eintrag in
 * getConversations.ts unverändert – kein Hard Delete, damit niemand
 * überraschend Nachrichten verliert, die die Gegenseite noch sehen will.
 */
export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<DeleteConversationResult> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, seller: { select: { userId: true } } },
  });

  if (!conversation) {
    return { status: "not_participant" };
  }

  const isBuyer = conversation.buyerId === userId;
  const isSeller = conversation.seller.userId === userId;

  if (!isBuyer && !isSeller) {
    return { status: "not_participant" };
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: isBuyer ? { deletedByBuyerAt: new Date() } : { deletedBySellerAt: new Date() },
  });

  return { status: "deleted" };
}
