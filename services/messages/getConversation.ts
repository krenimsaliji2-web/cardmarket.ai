import { prisma } from "@/lib/prisma";

export interface ConversationMessage {
  id: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ConversationParticipant {
  name: string;
  avatar: string | null;
}

export interface ConversationListingContext {
  id: string;
  cardName: string;
  image: string | null;
}

export interface GetConversationOptions {
  page?: number;
  pageSize?: number;
}

export interface ConversationDetail {
  id: string;
  buyerId: string;
  sellerId: string;
  /** User.id des Verkäufers (über sein SellerProfile) – für Ownership-Vergleiche auf Seiten-Ebene. */
  sellerUserId: string;
  /** Perspektive des Aufrufers: eigener Rolle in diesem Chat. */
  viewerRole: "buyer" | "seller";
  otherParticipant: ConversationParticipant;
  listing: ConversationListingContext | null;
  /** Chronologisch (älteste zuerst) für die Anzeige. */
  messages: ConversationMessage[];
  totalMessages: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 30;

/**
 * Lädt einen Chat inkl. Nachrichten (paginiert, neueste Seite zuerst
 * geladen, dann für die Anzeige chronologisch sortiert). Ownership-Check:
 * nur Käufer oder Verkäufer dieser Conversation dürfen lesen – beide
 * Fehlerfälle ("existiert nicht", "kein Teilnehmer") liefern `null`,
 * die Route zeigt dann notFound().
 *
 * Performance: eine einzige Query mit den nötigen Relations (buyer/seller/
 * listing→card) + eine Query für die Nachrichtenseite + eine für den
 * Gesamtzähler, letztere zwei über Promise.all – keine N+1.
 */
export async function getConversation(
  conversationId: string,
  userId: string,
  options: GetConversationOptions = {},
): Promise<ConversationDetail | null> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      buyer: { select: { name: true } },
      seller: { select: { userId: true, displayName: true, avatar: true } },
      listing: { select: { id: true, card: { select: { name: true, image: true } } } },
    },
  });

  if (!conversation) {
    return null;
  }

  const isBuyer = conversation.buyerId === userId;
  const isSeller = conversation.seller.userId === userId;

  if (!isBuyer && !isSeller) {
    return null;
  }

  const [messagesDesc, totalMessages] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, senderId: true, message: true, isRead: true, createdAt: true },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    id: conversation.id,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    sellerUserId: conversation.seller.userId,
    viewerRole: isBuyer ? "buyer" : "seller",
    otherParticipant: isBuyer
      ? { name: conversation.seller.displayName, avatar: conversation.seller.avatar }
      : { name: conversation.buyer.name, avatar: null },
    listing: conversation.listing
      ? {
          id: conversation.listing.id,
          cardName: conversation.listing.card.name,
          image: conversation.listing.card.image,
        }
      : null,
    messages: [...messagesDesc].reverse(),
    totalMessages,
    page,
    pageSize,
  };
}
