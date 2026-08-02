import { prisma } from "@/lib/prisma";

import {
  CommentTooLongError,
  InvalidRatingError,
  OrderNotFoundError,
  SellerNotInOrderError,
} from "./errors";

const MAX_COMMENT_LENGTH = 1000;

export interface CreateReviewInput {
  orderId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewResult {
  id: string;
  rating: number;
  comment: string | null;
}

/**
 * Legt eine Verkäuferbewertung an oder aktualisiert eine bestehende
 * (upsert über den Unique-Key orderId+sellerId+buyerId) – ein Käufer kann
 * pro Bestellung und Verkäufer also nie mehr als eine Bewertung haben,
 * ganz ohne separate "Duplicate Protection"-Logik: der DB-Unique-Constraint
 * und upsert() erledigen das atomar.
 *
 * Prüft vor dem Schreiben: Bestellung existiert und gehört dem Käufer
 * (kollabiert in denselben Fehler, kein Informationsleck), der Verkäufer
 * kommt tatsächlich in dieser Bestellung vor, rating liegt zwischen 1 und
 * 5, comment ist höchstens 1000 Zeichen lang.
 */
export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: input.buyerId },
    select: { id: true },
  });

  if (!order) {
    throw new OrderNotFoundError();
  }

  const sellerItem = await prisma.orderItem.findFirst({
    where: { orderId: input.orderId, sellerId: input.sellerId },
    select: { id: true },
  });

  if (!sellerItem) {
    throw new SellerNotInOrderError();
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new InvalidRatingError();
  }

  const comment = input.comment?.trim() || undefined;

  if (comment && comment.length > MAX_COMMENT_LENGTH) {
    throw new CommentTooLongError();
  }

  const review = await prisma.review.upsert({
    where: {
      orderId_sellerId_buyerId: {
        orderId: input.orderId,
        sellerId: input.sellerId,
        buyerId: input.buyerId,
      },
    },
    update: { rating: input.rating, comment: comment ?? null },
    create: {
      orderId: input.orderId,
      sellerId: input.sellerId,
      buyerId: input.buyerId,
      rating: input.rating,
      comment: comment ?? null,
    },
    select: { id: true, rating: true, comment: true },
  });

  return review;
}
