"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  peptideId: string;
  published: boolean;
};

export default function AdminPublishToggleButton({
  peptideId,
  published,
}: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/peptides/${peptideId}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          published: !published,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update publish status.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  const pillClasses = published
    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSaving}
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${pillClasses}`}
      >
        {isSaving ? "Saving..." : published ? "Unpublish" : "Publish"}
      </button>

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}