"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { addToCartAction } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  listingId: string;
  disabled?: boolean;
}

export function AddToCartButton({ listingId, disabled = false }: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToCartAction(listingId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Hinzufügen.");
        return;
      }
      setAdded(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        className="w-full"
        disabled={disabled || isPending}
        onClick={handleClick}
      >
        {disabled
          ? "Eigenes Angebot"
          : isPending
            ? "Wird hinzugefügt…"
            : "In den Warenkorb"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {added && (
        <p className="text-sm text-muted-foreground">
          Zum Warenkorb hinzugefügt.{" "}
          <Link href="/cart" className="font-medium text-primary underline-offset-4 hover:underline">
            Warenkorb ansehen
          </Link>
        </p>
      )}
    </div>
  );
}
