"use client";

import { useState, useTransition } from "react";
import {
  deleteInjectionPlan,
  toggleInjectionPlanActive,
} from "@/app/plans/actions";

type Props = {
  planId: string;
  active: boolean;
};

export default function InjectionPlanActions({ planId, active }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError("");

    startTransition(async () => {
      const result = await toggleInjectionPlanActive(planId, !active);

      if (!result.success) {
        setError(result.error || "Could not update plan.");
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this injection plan? This cannot be undone."
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      const result = await deleteInjectionPlan(planId);

      if (!result.success) {
        setError(result.error || "Could not delete plan.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
            active
              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          } ${isPending ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {active ? "Pause" : "Reactivate"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={`rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 ${
            isPending ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          Delete
        </button>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}