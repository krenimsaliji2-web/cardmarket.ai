"use client";

import { useEffect } from "react";

import { markAsReadAction } from "../actions";

interface MarkReadOnViewProps {
  conversationId: string;
}

/** Markiert beim Öffnen des Chats alle empfangenen Nachrichten als gelesen (kein UI-Output). */
export function MarkReadOnView({ conversationId }: MarkReadOnViewProps) {
  useEffect(() => {
    void markAsReadAction(conversationId);
  }, [conversationId]);

  return null;
}
