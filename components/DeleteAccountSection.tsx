"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/app/(protected)/profile/actions";

export default function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError("");

    startTransition(async () => {
      const result = await deleteMyAccount();

      if (result?.success === false) {
        setError(result.error || "Could not delete your account.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:rounded-3xl sm:p-5">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-red-900">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-red-800">
          This permanently deletes your account and personal data, including
          plans, reminders, logs, favorites, and saved stacks. This cannot be
          undone.
        </p>

        {!confirming ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Delete my account
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-red-300 bg-white p-4">
            <p className="text-sm font-medium text-red-900">
              Are you sure?
            </p>
            <p className="mt-1 text-sm text-red-700">
              This action is permanent and cannot be reversed.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                  isPending
                    ? "cursor-not-allowed bg-red-300"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {isPending ? "Deleting account..." : "Yes, delete my account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setError("");
                }}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
              >
                Cancel
              </button>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-700">{error}</p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}