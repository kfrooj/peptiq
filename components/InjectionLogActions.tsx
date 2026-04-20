"use client";

import { useState, useTransition } from "react";
import { deleteInjectionLog } from "@/app/(protected)/log-injection/actions";

type Props = {
  logId: string;
};

export default function InjectionLogActions({ logId }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this injection log? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      const result = await deleteInjectionLog(logId);

      if (!result.success) {
        setError(result.error || "Could not delete injection log.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={`rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 ${
          isPending ? "cursor-not-allowed opacity-70" : ""
        }`}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}