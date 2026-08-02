"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ListingSearchProps {
  initialSearch: string;
  initialActiveOnly: boolean;
}

/** Suchfunktion (Feature 78): Teiltreffer auf Kartenname/Verkäufername, siehe getListings.ts. */
export function ListingSearch({ initialSearch, initialActiveOnly }: ListingSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialSearch);
  const [activeOnly, setActiveOnly] = useState(initialActiveOnly);

  function applySearch(nextActiveOnly: boolean) {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (nextActiveOnly) params.set("activeOnly", "true");
    const qs = params.toString();
    router.push(qs ? `/admin/listings?${qs}` : "/admin/listings");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applySearch(activeOnly);
            }
          }}
          placeholder="Kartenname oder Verkäufer durchsuchen…"
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="activeOnly"
          checked={activeOnly}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setActiveOnly(next);
            applySearch(next);
          }}
        />
        <Label htmlFor="activeOnly" className="font-normal">
          Nur aktive Listings
        </Label>
      </div>
    </div>
  );
}
