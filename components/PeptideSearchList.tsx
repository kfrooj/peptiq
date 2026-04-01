"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Peptide } from "@/types/peptide";

type Props = {
  peptides: Peptide[];
};

export default function PeptideSearchList({ peptides }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(peptides.map((peptide) => peptide.category))
    );

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [peptides]);

  const filteredPeptides = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return peptides.filter((peptide) => {
      const matchesSearch =
        !searchLower ||
        peptide.name.toLowerCase().includes(searchLower) ||
        peptide.category.toLowerCase().includes(searchLower);

      const matchesCategory =
        !selectedCategory || peptide.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [peptides, search, selectedCategory]);

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">
              Browse peptides
            </h2>
            <span className="text-sm text-[var(--color-muted)]">
              {filteredPeptides.length} result
              {filteredPeptides.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search by peptide name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
            }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPeptides.map((peptide) => (
          <Link
            key={peptide.id}
            href={`/peptides/${peptide.slug}`}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-accent)] hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {peptide.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {peptide.category}
                </p>
              </div>

              <span className="text-sm font-medium text-[var(--color-accent)]">
                View
              </span>
            </div>
          </Link>
        ))}

        {!filteredPeptides.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-sm text-[var(--color-muted)]">
            No peptides match your search or category.
          </div>
        ) : null}
      </div>
    </div>
  );
}