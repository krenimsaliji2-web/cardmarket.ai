import { prisma } from "@/lib/prisma";

export interface ConversationListItem {
  id: string;
  otherParticipantName: string;
  otherParticipantAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
  listing: { id: string; cardName: string } | null;
}

export interface GetConversationsOptions {
  page?: number;
  pageSize?: number;
}

export interface GetConversationsResult {
  items: ConversationListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Lädt alle Chats eines Users (als Käufer ODER als Verkäufer über sein
 * SellerProfile), sortiert nach zuletzt aktiv. Chats, die der Aufrufer
 * über deleteConversation.ts für sich selbst "gelöscht" hat, werden aus
 * seiner eigenen Liste ausgeblendet (Soft Delete, siehe Schema-Kommentar)
 * – der jeweils andere Teilnehmer sieht sie unverändert weiter.
 *
 * Performance: genau eine findMany() mit allen nötigen Relations
 * (buyer/seller/listing→card, letzte Nachricht über `take: 1`,
 * ungelesene Anzahl über `_count`) + eine count() für die Pagination,
 * beide parallel über Promise.all – keine N+1, keine Zusatz-Query pro Zeile.
 */
export async function getConversations(
  userId: string,
  options: GetConversationsOptions = {},
): Promise<GetConversationsResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const where = {
    OR: [
      { buyerId: userId, deletedByBuyerAt: null },
      { seller: { userId }, deletedBySellerAt: null },
    ],
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        buyerId: true,
        updatedAt: true,
        buyer: { select: { name: true } },
        seller: { select: { userId: true, displayName: true, avatar: true } },
        listing: { select: { id: true, card: { select: { name: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { message: true },
        },
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: userId } } },
          },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return {
    items: conversations.map((conversation) => {
      const isBuyer = conversation.buyerId === userId;
      return {
        id: conversation.id,
        otherParticipantName: isBuyer ? conversation.seller.displayName : conversation.buyer.name,
        otherParticipantAvatar: isBuyer ? conversation.seller.avatar : null,
        lastMessage: conversation.messages[0]?.message ?? null,
        lastMessageAt: conversation.updatedAt,
        unreadCount: conversation._count.messages,
        listing: conversation.listing
          ? { id: conversation.listing.id, cardName: conversation.listing.card.name }
          : null,
      };
    }),
    total,
    page,
    pageSize,
  };
}
