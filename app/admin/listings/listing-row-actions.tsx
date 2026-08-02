"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { toggleListingActiveAsAdminAction } from "./actions";

interface ListingRowActionsProps {
  listingId: string;
  isActive: boolean;
}

/** Listing deaktivieren/reaktivieren (Feature 78 – Moderation), ruft ausschließlich die bestehende toggleListingActiveAsAdmin() über die Server Action auf. */
export function ListingRowActions({ listingId, isActive }: ListingRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleListingActiveAsAdminAction(listingId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Aktualisieren.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleToggle}>
        {isActive ? "Deaktivieren" : "Reaktivieren"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
