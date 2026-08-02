"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import type { ReportStatus } from "@/prisma/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteReportAction, updateReportStatusAction } from "./actions";

// Nur Typ-Import von ReportStatus (siehe report-filters.tsx für die
// Begründung) – literale Strings statt Laufzeit-Enum-Zugriff.
const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "OPEN", label: "Offen" },
  { value: "IN_PROGRESS", label: "In Bearbeitung" },
  { value: "RESOLVED", label: "Gelöst" },
  { value: "REJECTED", label: "Abgelehnt" },
];

interface ReportRowActionsProps {
  reportId: string;
  status: ReportStatus;
}

export function ReportRowActions({ reportId, status }: ReportRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(newStatus: ReportStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateReportStatusAction(reportId, newStatus);
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
      const result = await deleteReportAction(reportId);
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
        <Select
          value={status}
          onValueChange={(value) => handleStatusChange(value as ReportStatus)}
          disabled={isPending}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={handleDelete}
          aria-label="Meldung löschen"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
