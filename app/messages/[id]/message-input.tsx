"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { sendMessageAction } from "../actions";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (trimmed.length === 0 || isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction(conversationId, trimmed);
      if (!result.success) {
        setError(result.error ?? "Fehler beim Senden.");
        return;
      }
      setValue("");
      router.refresh();
      textareaRef.current?.focus();
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nachricht schreiben…"
          maxLength={2000}
          rows={2}
          disabled={isPending}
          className="resize-none"
        />
        <Button type="button" onClick={handleSend} disabled={isPending || value.trim().length === 0}>
          {isPending ? "Sendet…" : "Senden"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
