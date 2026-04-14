"use client";

import { useState } from "react";

type Props = {
  className?: string;
  label?: string;
};

export default function UpgradeToProButton({
  className = "",
  label = "Upgrade to Pro",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const contentType = response.headers.get("content-type") ?? "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          text || "Checkout route returned a non-JSON response."
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Could not start checkout.");
      }

      if (!data?.url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className={
          className ||
          `inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-white transition ${
            loading ? "cursor-not-allowed bg-slate-400" : "hover:opacity-90"
          }`
        }
      >
        {loading ? "Redirecting..." : label}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}