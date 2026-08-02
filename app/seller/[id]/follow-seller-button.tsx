"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { followSellerAction, unfollowSellerAction } from "./actions";

interface FollowSellerButtonProps {
  sellerId: string;
  initialIsFollowing: boolean;
}

export function FollowSellerButton({ sellerId, initialIsFollowing }: FollowSellerButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = isFollowing
        ? await unfollowSellerAction(sellerId)
        : await followSellerAction(sellerId);

      if (!result.success) {
        setError(result.error ?? "Fehler.");
        return;
      }
      setIsFollowing(!isFollowing);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={isFollowing ? "outline" : "default"}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? "…" : isFollowing ? "Entfolgen" : "Folgen"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
