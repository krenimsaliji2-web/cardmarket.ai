"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { submitReviewAction, type ReviewFormState } from "./actions";

const initialState: ReviewFormState = { errors: {} };

interface ReviewFormProps {
  orderId: string;
  sellerId: string;
  sellerName: string;
  existingRating: number | null;
  existingComment: string | null;
}

export function ReviewForm({
  orderId,
  sellerId,
  sellerName,
  existingRating,
  existingComment,
}: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState(submitReviewAction, initialState);
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{sellerName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="sellerId" value={sellerId} />
          <input type="hidden" name="rating" value={rating} />

          <div className="space-y-2">
            <Label>Bewertung</Label>
            <div className="flex gap-1" onMouseLeave={() => setHoveredRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={isPending}
                  aria-label={`${star} Sterne`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onClick={() => setRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={
                      star <= displayRating
                        ? "size-6 fill-yellow-400 text-yellow-400"
                        : "size-6 text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
            {state.errors.rating && (
              <p className="text-sm text-destructive">{state.errors.rating}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`comment-${sellerId}`}>Kommentar (optional)</Label>
            <Textarea
              id={`comment-${sellerId}`}
              name="comment"
              rows={3}
              maxLength={1000}
              disabled={isPending}
              defaultValue={existingComment ?? ""}
              aria-invalid={!!state.errors.comment}
            />
            {state.errors.comment && (
              <p className="text-sm text-destructive">{state.errors.comment}</p>
            )}
          </div>

          {state.errors.general && (
            <p className="text-sm text-destructive">{state.errors.general}</p>
          )}
          {state.success && (
            <p className="text-sm text-muted-foreground">Bewertung gespeichert.</p>
          )}

          <Button type="submit" disabled={isPending || rating < 1}>
            {isPending ? "Wird gespeichert…" : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
