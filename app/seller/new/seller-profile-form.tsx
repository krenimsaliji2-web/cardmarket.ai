"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createSellerProfileAction, type SellerProfileFormState } from "./actions";

const initialState: SellerProfileFormState = { errors: {} };

export function SellerProfileForm() {
  const [state, formAction, isPending] = useActionState(
    createSellerProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          minLength={3}
          maxLength={40}
          disabled={isPending}
          aria-invalid={!!state.errors.displayName}
        />
        {state.errors.displayName && (
          <p className="text-sm text-destructive">{state.errors.displayName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Land</Label>
        <Input
          id="country"
          name="country"
          required
          disabled={isPending}
          aria-invalid={!!state.errors.country}
        />
        {state.errors.country && (
          <p className="text-sm text-destructive">{state.errors.country}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          disabled={isPending}
          aria-invalid={!!state.errors.bio}
        />
        {state.errors.bio && (
          <p className="text-sm text-destructive">{state.errors.bio}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Wird erstellt…" : "Verkäufer werden"}
      </Button>
    </form>
  );
}
