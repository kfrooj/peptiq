"use client";

import { useState, useTransition } from "react";
import {
  favoritePeptide,
  unfavoritePeptide,
} from "@/app/(protected)/dashboard/actions";

type Props = {
  peptideId: string;
  initialIsFavorite?: boolean;
};

export default function PeptideFavoriteStarButton({
  peptideId,
  initialIsFavorite = false,
}: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError("");

    startTransition(async () => {
      if (isFavorite) {
        const result = await unfavoritePeptide(peptideId);

        if (result.success) {
          setIsFavorite(false);
        } else {
          setError(result.error || "Could not remove favorite.");
        }

        return;
      }

      const result = await favoritePeptide(peptideId);

      if (result.success) {
        setIsFavorite(true);
      } else {
        setError(result.error || "Could not save favorite.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
        title={isFavorite ? "Remove favorite" : "Add favorite"}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
          isFavorite
            ? "border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100"
            : "border-[var(--color-border)] bg-white text-gray-400 hover:bg-[var(--color-surface-muted)] hover:text-amber-500"
        } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.75.75 0 0 1 1.04 0l2.363 2.3a.75.75 0 0 0 .427.2l3.266.474a.75.75 0 0 1 .416 1.279l-2.363 2.304a.75.75 0 0 0-.216.664l.558 3.252a.75.75 0 0 1-1.088.79L12.96 13.52a.75.75 0 0 0-.698 0l-2.922 1.536a.75.75 0 0 1-1.088-.79l.558-3.252a.75.75 0 0 0-.216-.664L6.23 8.046a.75.75 0 0 1 .416-1.279l3.266-.474a.75.75 0 0 0 .427-.2l2.363-2.3Z"
          />
        </svg>
      </button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}