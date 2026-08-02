"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface MessageListScrollProps {
  children: ReactNode;
  /** Ändert sich mit jeder neuen Nachricht (z. B. Nachrichtenanzahl) – löst erneutes Scrollen ans Ende aus. */
  scrollKey: number;
}

/** Scrollt die Nachrichtenliste beim Laden und bei jeder neuen Nachricht automatisch ans Ende. */
export function MessageListScroll({ children, scrollKey }: MessageListScrollProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [scrollKey]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
      {children}
      <div ref={bottomRef} />
    </div>
  );
}
