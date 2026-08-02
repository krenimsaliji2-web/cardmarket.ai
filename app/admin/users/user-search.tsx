"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface UserSearchProps {
  initial: string;
}

/** Suchfunktion (Feature 78): Teiltreffer auf Name/E-Mail/Username, siehe getUsers.ts. */
export function UserSearch({ initial }: UserSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function applySearch() {
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            applySearch();
          }
        }}
        placeholder="Name, E-Mail oder Username durchsuchen…"
        className="pl-9"
      />
    </div>
  );
}
