"use client";

import { useState, useTransition } from "react";

type Props = {
  initialIsFavorite?: boolean;
  favoriteLabel?: string;
  favoritedLabel?: string;
  onFavorite: () => Promise<unknown> | unknown;
  onUnfavorite: () => Promise<unknown> | unknown;
  className?: string;
};

export default function FavoriteButton({
  initialIsFavorite = false,
  favoriteLabel = "Favorite",
  favoritedLabel = "Favorited",
  onFavorite,
  onUnfavorite,
  className = "",
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isFavorite) {
        await onUnfavorite();
        setIsFavorite(false);
      } else {
        await onFavorite();
        setIsFavorite(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${className} ${
        isFavorite
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:opacity-90"
          : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
      } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
    >
      {isFavorite ? favoritedLabel : favoriteLabel}
    </button>
  );
}