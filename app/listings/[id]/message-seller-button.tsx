"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { startConversationFromListingAction } from "./actions";

interface MessageSellerButtonProps {
  listingId: string;
  disabled?: boolean;
}

export function MessageSellerButton({ listingId, disabled = false }: MessageSellerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startConversationFromListingAction(listingId);
      // Bei Erfolg löst die Server Action einen redirect() aus – diese
      // Zeile wird dann nie erreicht.
      if (!result.success) {
        setError(result.error ?? "Fehler beim Starten des Chats.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || isPending}
        onClick={handleClick}
      >
        {isPending ? "Wird geöffnet…" : "Nachricht senden"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
