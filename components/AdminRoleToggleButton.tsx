"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
};

export default function AdminRoleToggleButton({
  userId,
  isAdmin,
  isSelf,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: isAdmin ? "user" : "admin",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Could not update user role.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed.");
    } finally {
      setLoading(false);
    }
  }

  if (isAdmin && isSelf) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled
          className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500"
        >
          Your admin account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isAdmin
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {loading ? "Saving..." : isAdmin ? "Remove admin" : "Make admin"}
      </button>

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}