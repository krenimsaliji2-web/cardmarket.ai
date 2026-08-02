"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteNotificationAction, markNotificationAsReadAction } from "./actions";

interface NotificationActionsProps {
  notificationId: string;
  isRead: boolean;
}

export function NotificationActions({ notificationId, isRead }: NotificationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMarkAsRead() {
    setError(null);
    startTransition(async () => {
      const result = await markNotificationAsReadAction(notificationId);
      if (!result.success) {
        setError(result.error ?? "Fehler.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteNotificationAction(notificationId);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Löschen.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {!isRead && (
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleMarkAsRead}>
            Als gelesen markieren
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={handleDelete}
          aria-label="Benachrichtigung löschen"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
