"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PeptideSearchListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

type Props = {
  peptides?: PeptideSearchListItem[];
};

function getCategoryStyle(category: string) {
  const value = category.toLowerCase();

  if (value.includes("fat") || value.includes("weight")) {
    return {
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      icon: "🔥",
    };
  }

  if (value.includes("healing") || value.includes("recovery")) {
    return {
      bg: "bg-blue-50",
      ring: "ring-blue-100",
      icon: "🛠️",
    };
  }

  if (value.includes("cognitive") || value.includes("brain")) {
    return {
      bg: "bg-purple-50",
      ring: "ring-purple-100",
      icon: "🧠",
    };
  }

  if (value.includes("longevity") || value.includes("anti")) {
    return {
      bg: "bg-amber-50",
      ring: "ring-amber-100",
      icon: "⏳",
    };
  }

  return {
    bg: "bg-gray-50",
    ring: "ring-gray-100",
    icon: "🧬",
  };
}

export default function PeptideSearchList({ peptides = [] }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        peptides
          .map((peptide) => peptide.category)
          .filter((category): category is string => Boolean(category))
      )
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

  const hasActiveFilters = Boolean(search.trim() || selectedCategory);

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">
              Browse peptides
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Explore detailed research insights, usage patterns, and
              calculator-ready data for each peptide.
            </p>
          </div>

          <div className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">
            {filteredPeptides.length} result
            {filteredPeptides.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-[1.4fr_0.9fr_auto]">
          <input
            type="text"
            placeholder="Search by peptide name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] transition focus:border-[var(--color-accent)] focus:bg-white"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:bg-white"
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
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:bg-white md:w-auto"
          >
            Clear filters
          </button>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap gap-2">
            {search.trim() ? (
              <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                Search: {search.trim()}
              </span>
            ) : null}

            {selectedCategory ? (
              <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                Category: {selectedCategory}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:gap-4">
        {filteredPeptides.length ? (
          filteredPeptides.map((peptide) => {
            const style = getCategoryStyle(peptide.category);

            return (
              <Link
                key={peptide.id}
                href={`/peptides/${peptide.slug}`}
                className={`group rounded-3xl border border-[var(--color-border)] ${style.bg} p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      {peptide.category}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm ring-1 ${style.ring}`}
                      >
                        {style.icon}
                      </span>

                      <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl">
                        {peptide.name}
                      </h3>
                    </div>
                  </div>

                  <div className="shrink-0 text-[var(--color-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                    <span className="text-lg leading-none">→</span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 text-center shadow-sm">
            <p className="text-base font-medium text-[var(--color-text)]">
              No peptides match your filters
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Try a different search term or clear the selected category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}