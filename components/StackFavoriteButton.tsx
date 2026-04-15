"use client";

import FavoriteButton from "@/components/FavoriteButton";
import {
  favoriteStack,
  unfavoriteStack,
} from "@/app/(protected)/dashboard/actions";

type Props = {
  stackId: string;
  initialIsFavorite?: boolean;
};

export default function StackFavoriteButton({
  stackId,
  initialIsFavorite = false,
}: Props) {
  return (
    <FavoriteButton
      initialIsFavorite={initialIsFavorite}
      favoriteLabel="Favorite"
      favoritedLabel="Favorited"
      onFavorite={() => favoriteStack(stackId)}
      onUnfavorite={() => unfavoriteStack(stackId)}
      className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition"
    />
  );
}