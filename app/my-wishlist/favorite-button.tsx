"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { toggleFavoriteAction } from "./actions";

interface FavoriteButtonProps {
  cardId: string;
  language: string;
  condition: string;
  foil: boolean;
  /** Serverseitig berechneter Ausgangszustand (Feature 77 – "Favoritenstatus laden") – kein Client-Fetch nach dem Mounten, SSR bleibt maßgeblich. */
  initialFavorited: boolean;
  /** True, wenn kein eingeloggter User vorliegt – Klick führt zu /login statt zu togglen. */
  requiresLogin?: boolean;
  /** True für eigene Listings ("Besitzer können eigene Listings nicht favorisieren", Marketplace-Kontext). */
  disabled?: boolean;
  /** Overlay auf einem Bild (Marketplace-Karte) statt Inline-Button (Kartendetail). */
  variant?: "overlay" | "inline";
  className?: string;
}

/**
 * Herzsymbol-Toggle (Feature 77 – Favoriten). Wiederverwendet ausschließlich
 * toggleFavoriteAction() (app/my-wishlist/actions.ts), das seinerseits
 * ausschließlich bestehende Wishlist-Funktionen aufruft – kein neues
 * Datenmodell. Aktualisiert den optischen Zustand direkt aus der
 * Server-Antwort statt eines vollständigen Seiten-Refreshs (schnelleres
 * Feedback, analog zu AddToCartButton).
 */
export function FavoriteButton({
  cardId,
  language,
  condition,
  foil,
  initialFavorited,
  requiresLogin = false,
  disabled = false,
  variant = "inline",
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (requiresLogin) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      const result = await toggleFavoriteAction(cardId, language, condition, foil);
      if (result.success) {
        setFavorited(result.favorited);
      }
    });
  }

  const label = favorited ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen";

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        aria-label={label}
        aria-pressed={favorited}
        title={disabled ? "Eigenes Angebot kann nicht favorisiert werden" : label}
        className={cn(
          "absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        <Heart
          className={cn("size-4", favorited ? "fill-destructive text-destructive" : "text-foreground")}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isPending}
      onClick={handleClick}
      aria-pressed={favorited}
      className={className}
    >
      <Heart className={cn("size-4", favorited ? "fill-destructive text-destructive" : "")} />
      {favorited ? "Favorisiert" : "Zu Favoriten hinzufügen"}
    </Button>
  );
}
