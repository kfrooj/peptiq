"use client";

import { useState, useTransition } from "react";
import {
  deleteReminder,
  markReminderCompleted,
} from "@/app/(protected)/plans/actions";

type Props = {
  reminderId: string;
};

export default function MissedPlanReminderActions({ reminderId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleMarkCompleted() {
    setError("");

    startTransition(async () => {
      const result = await markReminderCompleted(reminderId);

      if (!result.success) {
        setError(result.error || "Could not mark reminder completed.");
      }
    });
  }

  function handleDelete() {
    setError("");

    const confirmed = window.confirm("Delete this missed reminder?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteReminder(reminderId);

      if (!result.success) {
        setError(result.error || "Could not delete reminder.");
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleMarkCompleted}
          disabled={isPending}
          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Mark completed
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}