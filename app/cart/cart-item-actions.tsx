"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { changeQuantityAction, removeFromCartAction } from "./actions";

interface CartItemActionsProps {
  cartItemId: string;
  quantity: number;
  maxQuantity: number;
}

export function CartItemActions({ cartItemId, quantity, maxQuantity }: CartItemActionsProps) {
  const router = useRouter();
  const [value, setValue] = useState(quantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleQuantityChange(next: number) {
    if (!Number.isInteger(next) || next < 1) {
      return;
    }
    const clamped = Math.min(next, maxQuantity);
    setValue(clamped);
    setError(null);

    startTransition(async () => {
      const result = await changeQuantityAction(cartItemId, clamped);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Aktualisieren.");
        return;
      }
      router.refresh();
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeFromCartAction(cartItemId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Entfernen.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={maxQuantity}
          value={value}
          disabled={isPending}
          onChange={(event) => handleQuantityChange(Number.parseInt(event.target.value, 10))}
          className="w-20"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={handleRemove}
          aria-label="Aus dem Warenkorb entfernen"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
