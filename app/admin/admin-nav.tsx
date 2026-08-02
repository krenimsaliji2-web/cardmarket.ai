import Link from "next/link";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "users", label: "Benutzer", href: "/admin/users" },
  { key: "listings", label: "Listings", href: "/admin/listings" },
  { key: "reports", label: "Meldungen", href: "/admin/reports" },
] as const;

interface AdminNavProps {
  active: (typeof NAV_ITEMS)[number]["key"];
}

/** Einfache Navigation zwischen den Admin-Bereichen (Feature 78) – zuvor waren die Admin-Seiten nicht miteinander verlinkt. */
export function AdminNav({ active }: AdminNavProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === item.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
