"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  peptideId: string;
  peptideName: string;
};

export default function DeletePeptideButton({
  peptideId,
  peptideName,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${peptideName}"?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.from("peptides").delete().eq("id", peptideId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/peptides");
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete peptide"}
      </button>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}