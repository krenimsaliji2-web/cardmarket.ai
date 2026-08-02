"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavLinkItem {
  href: string;
  label: string;
}

const GUEST_LINKS: NavLinkItem[] = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/catalog", label: "Spiele" },
];

const AUTH_LINKS: NavLinkItem[] = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/catalog", label: "Spiele" },
  { href: "/my-wishlist", label: "Wishlist" },
  { href: "/messages", label: "Nachrichten" },
  { href: "/cart", label: "Warenkorb" },
  { href: "/orders", label: "Bestellungen" },
  { href: "/seller", label: "Verkäufer-Dashboard" },
  { href: "/dashboard", label: "Profil" },
];

const ADMIN_LINK: NavLinkItem = { href: "/admin", label: "Admin" };

interface SiteHeaderNavProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  cartCount: number;
  unreadCount: number;
}

/** Aktuelle Seite hervorheben – "/" nur exakt, alles andere per Präfix (z. B. /admin markiert auch auf /admin/users). */
function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  onNavigate,
  badge,
}: NavLinkItem & { active: boolean; onNavigate?: () => void; badge?: number }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      {!!badge && (
        <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1 tabular-nums">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  );
}

export function SiteHeaderNav({ isLoggedIn, isAdmin, cartCount, unreadCount }: SiteHeaderNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = isLoggedIn ? AUTH_LINKS : GUEST_LINKS;
  const badgeByHref: Record<string, number> = {
    "/cart": cartCount,
    "/messages": unreadCount,
  };

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-heading text-lg font-bold tracking-tight">
          Project Atlas
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              active={isActivePath(pathname, link.href)}
              badge={badgeByHref[link.href]}
            />
          ))}
          {isLoggedIn && isAdmin && (
            <NavLink {...ADMIN_LINK} active={isActivePath(pathname, ADMIN_LINK.href)} />
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {isLoggedIn ? (
            <LogoutButton />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Registrieren</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {isLoggedIn && (
            <>
              <Button asChild variant="ghost" size="icon-sm" className="relative">
                <Link href="/cart" aria-label="Warenkorb">
                  <ShoppingCart className="size-5" />
                  {cartCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px] tabular-nums"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon-sm" className="relative">
                <Link href="/messages" aria-label="Nachrichten">
                  <MessageCircle className="size-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px] tabular-nums"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </>
          )}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Menü öffnen">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-3/4">
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <NavLink
                      {...link}
                      active={isActivePath(pathname, link.href)}
                      onNavigate={closeMenu}
                      badge={badgeByHref[link.href]}
                    />
                  </SheetClose>
                ))}
                {isLoggedIn && isAdmin && (
                  <SheetClose asChild>
                    <NavLink
                      {...ADMIN_LINK}
                      active={isActivePath(pathname, ADMIN_LINK.href)}
                      onNavigate={closeMenu}
                    />
                  </SheetClose>
                )}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t p-4">
                {isLoggedIn ? (
                  <LogoutButton />
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" onClick={closeMenu}>
                        <Link href="/login">Login</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild onClick={closeMenu}>
                        <Link href="/register">Registrieren</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
