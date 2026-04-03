"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type PeptideOption = {
  id: string;
  name: string;
};

type Props = {
  peptides: PeptideOption[];
  sites: string[];
};

export default function WellnessFilters({ peptides, sites }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [peptideId, setPeptideId] = useState(
    searchParams.get("peptideId") || ""
  );
  const [site, setSite] = useState(searchParams.get("site") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  function handleApply() {
    const params = new URLSearchParams();

    if (peptideId) params.set("peptideId", peptideId);
    if (site) params.set("site", site);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const query = params.toString();
    router.push(query ? `/wellness?${query}` : "/wellness");
  }

  function handleClear() {
    setPeptideId("");
    setSite("");
    setStartDate("");
    setEndDate("");
    router.push("/wellness");
  }

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">
        Filters
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Peptide
          </label>
          <select
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="">All peptides</option>
            {peptides.map((peptide) => (
              <option key={peptide.id} value={peptide.id}>
                {peptide.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Site
          </label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="">All sites</option>
            {sites.map((siteOption) => (
              <option key={siteOption} value={siteOption}>
                {siteOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            End date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          Apply filters
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}