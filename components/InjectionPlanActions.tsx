"use client";

import { useState, useTransition } from "react";
import {
  deleteInjectionPlan,
  toggleInjectionPlanActive,
} from "@/app/(protected)/plans/actions";

type Props = {
  planId: string;
  active: boolean;
};

type PendingAction = "toggle" | "delete" | null;

export default function InjectionPlanActions({ planId, active }: Props) {
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError("");
    setPendingAction("toggle");

    startTransition(async () => {
      const result = await toggleInjectionPlanActive(planId, !active);

      if (!result.success) {
        setError(result.error || "Could not update plan.");
      }

      setPendingAction(null);
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this plan permanently?\n\nThis cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setPendingAction("delete");

    startTransition(async () => {
      const result = await deleteInjectionPlan(planId);

      if (!result.success) {
        setError(result.error || "Could not delete plan.");
      }

      setPendingAction(null);
    });
  }

  const toggleLabel = isPending && pendingAction === "toggle"
    ? active
      ? "Archiving..."
      : "Activating..."
    : active
    ? "Archive plan"
    : "Activate plan";

  const deleteLabel =
    isPending && pendingAction === "delete" ? "Deleting..." : "Delete";

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-disabled={isPending}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            active
              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {toggleLabel}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-disabled={isPending}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 ${
            isPending ? "cursor-not-allowed opacity-70" : ""
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