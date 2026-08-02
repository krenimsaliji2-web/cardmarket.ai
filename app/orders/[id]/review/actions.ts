"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createReview } from "@/services/reviews/createReview";
import {
  CommentTooLongError,
  InvalidRatingError,
  OrderNotFoundError,
  SellerNotInOrderError,
} from "@/services/reviews/errors";

export interface ReviewFormState {
  errors: {
    rating?: string;
    comment?: string;
    general?: string;
  };
  success?: boolean;
}

export async function submitReviewAction(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "");
  const rating = Number(formData.get("rating"));
  const rawComment = formData.get("comment");
  const comment = typeof rawComment === "string" ? rawComment : undefined;

  try {
    await createReview({
      orderId,
      sellerId,
      buyerId: session.user.id,
      rating,
      comment,
    });
  } catch (error) {
    if (error instanceof InvalidRatingError) {
      return { errors: { rating: "Bitte wähle 1 bis 5 Sterne." } };
    }
    if (error instanceof CommentTooLongError) {
      return { errors: { comment: "Der Kommentar darf maximal 1000 Zeichen lang sein." } };
    }
    if (error instanceof OrderNotFoundError || error instanceof SellerNotInOrderError) {
      return { errors: { general: "Diese Bestellung kann nicht bewertet werden." } };
    }
    throw error;
  }

  revalidatePath(`/orders/${orderId}/review`);
  revalidatePath(`/seller/${sellerId}`);
  revalidatePath("/seller");

  return { errors: {}, success: true };
}
