"use client";

import { useState, useTransition } from "react";
import {
  deleteReminder,
  markReminderCompleted,
} from "@/app/(protected)/plans/actions";

type Props = {
  reminderId: string;
};

type PendingAction = "complete" | "delete" | null;

export default function MissedPlanReminderActions({ reminderId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState("");

  function handleMarkCompleted() {
    setError("");
    setPendingAction("complete");

    startTransition(async () => {
      const result = await markReminderCompleted(reminderId);

      if (!result.success) {
        setError(result.error || "Could not mark reminder as completed.");
      }

      setPendingAction(null);
    });
  }

  function handleDelete() {
    setError("");

    const confirmed = window.confirm(
      "Delete this missed reminder?\n\nThis cannot be undone."
    );
    if (!confirmed) return;

    setPendingAction("delete");

    startTransition(async () => {
      const result = await deleteReminder(reminderId);

      if (!result.success) {
        setError(result.error || "Could not delete reminder.");
      }

      setPendingAction(null);
    });
  }

  const completeLabel =
    isPending && pendingAction === "complete"
      ? "Updating..."
      : "Mark completed";

  const deleteLabel =
    isPending && pendingAction === "delete" ? "Deleting..." : "Delete";

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleMarkCompleted}
          disabled={isPending}
          aria-disabled={isPending}
          className={`rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 ${
            isPending ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {completeLabel}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-disabled={isPending}
          className={`rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 ${
            isPending ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {deleteLabel}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:max-w-xs">
          {error}
        </div>
      ) : null}
    </div>
  );
}