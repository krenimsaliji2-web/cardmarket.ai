"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteListingAction, toggleListingActiveAction } from "./actions";

interface ListingActionsProps {
  listingId: string;
  isActive: boolean;
}

export function ListingActions({ listingId, isActive }: ListingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleListingActiveAction(listingId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Aktualisieren.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteListingAction(listingId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Löschen.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" disabled={isPending}>
          <Link href={`/seller/listings/${listingId}`}>Bearbeiten</Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleToggle}
        >
          {isActive ? "Deaktivieren" : "Aktivieren"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm" disabled={isPending}>
              Löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Listing wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Das Listing
                und alle zugehörigen Bilder werden dauerhaft gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction disabled={isPending} onClick={handleDelete}>
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
