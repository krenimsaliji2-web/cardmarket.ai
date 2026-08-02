"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ReportStatus, ReportType } from "@/prisma/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// shadcn Select erlaubt keinen leeren String als Item-Value.
const ALL_VALUE = "__all__";

// Nur Typ-Import von ReportStatus/ReportType (kein Laufzeit-Wert) – ein
// Laufzeit-Import aus dem generierten Prisma-Client bricht in dieser
// "use client"-Komponente den Turbopack-Build (Prisma-Runtime kann nicht
// in den Browser-Bundle gepackt werden). Literale Strings sind hier
// typsicher, da ReportStatus/ReportType reine String-Union-Types sind.
const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "OPEN", label: "Offen" },
  { value: "IN_PROGRESS", label: "In Bearbeitung" },
  { value: "RESOLVED", label: "Gelöst" },
  { value: "REJECTED", label: "Abgelehnt" },
];

const TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "LISTING", label: "Listing" },
  { value: "REVIEW", label: "Bewertung" },
  { value: "USER", label: "Benutzer" },
];

export interface ReportFiltersInitialValues {
  status: string;
  type: string;
}

interface ReportFiltersProps {
  initial: ReportFiltersInitialValues;
}

export function ReportFilters({ initial }: ReportFiltersProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status || ALL_VALUE);
  const [type, setType] = useState(initial.type || ALL_VALUE);

  function applyFilters() {
    const params = new URLSearchParams();
    if (status !== ALL_VALUE) params.set("status", status);
    if (type !== ALL_VALUE) params.set("type", type);

    const qs = params.toString();
    router.push(qs ? `/admin/reports?${qs}` : "/admin/reports");
  }

  function resetFilters() {
    router.push("/admin/reports");
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Alle Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Typ</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle Typen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Alle Typen</SelectItem>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={applyFilters}>Filter anwenden</Button>
        <Button variant="outline" onClick={resetFilters}>
          Zurücksetzen
        </Button>
      </div>
    </div>
  );
}
