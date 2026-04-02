"use client";

import { useState, useTransition } from "react";

type Props = {
  initialIsFavorite?: boolean;
  favoriteLabel?: string;
  favoritedLabel?: string;
  onFavorite: () => Promise<{ success: boolean; error?: string }>;
  onUnfavorite?: () => Promise<{ success: boolean; error?: string }>;
};

export default function FavoriteButton({
  initialIsFavorite = false,
  favoriteLabel = "Favorite",
  favoritedLabel = "Favorited",
  onFavorite,
  onUnfavorite,
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError("");

    startTransition(async () => {
      if (isFavorite && onUnfavorite) {
        const result = await onUnfavorite();

        if (result.success) {
          setIsFavorite(false);
        } else {
          setError(result.error || "Could not remove favorite.");
        }

        return;
      }

      const result = await onFavorite();

      if (result.success) {
        setIsFavorite(true);
      } else {
        setError(result.error || "Could not save favorite.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
          isFavorite
            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
        } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {isPending
          ? "Saving..."
          : isFavorite
          ? favoritedLabel
          : favoriteLabel}
      </button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}