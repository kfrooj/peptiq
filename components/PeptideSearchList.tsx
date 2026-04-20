"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type PeptideSearchListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

type Props = {
  peptides?: PeptideSearchListItem[];
};

type PageSizeOption = 30 | 60 | 100 | "all";

function getCategoryStyle(category: string) {
  const value = category.toLowerCase();

  if (value.includes("fat") || value.includes("weight")) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value.includes("healing") || value.includes("recovery")) {
    return "bg-blue-50 text-blue-700";
  }

  if (value.includes("cognitive") || value.includes("brain")) {
    return "bg-purple-50 text-purple-700";
  }

  if (value.includes("longevity") || value.includes("anti")) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function PeptideSearchList({ peptides = [] }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeOption>(30);
  const [page, setPage] = useState(1);

  const sortedPeptides = useMemo(() => {
    return [...peptides].sort((a, b) => a.name.localeCompare(b.name));
  }, [peptides]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        sortedPeptides
          .map((peptide) => peptide.category)
          .filter((category): category is string => Boolean(category))
      )
    );

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [sortedPeptides]);

  const filteredPeptides = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return sortedPeptides.filter((peptide) => {
      const matchesSearch =
        !searchLower ||
        peptide.name.toLowerCase().includes(searchLower) ||
        peptide.category.toLowerCase().includes(searchLower);

      const matchesCategory =
        !selectedCategory || peptide.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [sortedPeptides, search, selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, pageSize]);

  const totalResults = filteredPeptides.length;
  const effectivePageSize = pageSize === "all" ? totalResults || 1 : pageSize;
  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalResults / effectivePageSize));

  const currentPage = Math.min(page, totalPages);
  const startIndex = pageSize === "all" ? 0 : (currentPage - 1) * effectivePageSize;
  const endIndex = pageSize === "all" ? totalResults : startIndex + effectivePageSize;

  const visiblePeptides = filteredPeptides.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(search.trim() || selectedCategory);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
              Browse peptides
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Explore detailed reference pages, dosage ranges, calculator-ready defaults,
              and research links for each peptide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/peptides/glossary"
              className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:bg-white"
            >
              Peptides Glossary
            </Link>

            <div className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">
              {totalResults} result{totalResults === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.7fr_auto]">
            <input
              type="text"
              placeholder="Search by peptide name or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] transition focus:border-[var(--color-accent)]"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={String(pageSize)}
              onChange={(e) => {
                const value = e.target.value;
                setPageSize(
                  value === "all" ? "all" : (Number(value) as 30 | 60 | 100)
                );
              }}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="30">Show 30</option>
              <option value="60">Show 60</option>
              <option value="100">Show 100</option>
              <option value="all">Show all</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setPageSize(30);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] md:w-auto"
            >
              Clear filters
            </button>
          </div>

          {hasActiveFilters ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {search.trim() ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                  Search: {search.trim()}
                </span>
              ) : null}

              {selectedCategory ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                  Category: {selectedCategory}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 bg-[var(--color-surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] md:grid">
          <div>Peptide</div>
          <div>Category</div>
          <div>Action</div>
        </div>

        {!visiblePeptides.length ? (
          <div className="p-8 text-center">
            <p className="text-base font-medium text-[var(--color-text)]">
              No peptides match your filters
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Try a different search term or clear the selected category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {visiblePeptides.map((peptide) => (
              <div key={peptide.id} className="px-3 py-2.5 sm:px-4 sm:py-3">
                {/* Mobile: tight single-row layout */}
                <div className="flex items-center justify-between gap-2 md:hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {peptide.name}
                    </p>

                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryStyle(
                        peptide.category
                      )}`}
                    >
                      {peptide.category}
                    </span>
                  </div>

                  <Link
                    href={`/peptides/${peptide.slug}`}
                    className="inline-flex shrink-0 items-center rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    View
                  </Link>
                </div>

                {/* Desktop/tablet: keep structured layout */}
                <div className="hidden gap-3 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)] sm:text-base">
                      {peptide.name}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getCategoryStyle(
                        peptide.category
                      )}`}
                    >
                      {peptide.category}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/peptides/${peptide.slug}`}
                      className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalResults > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            Showing{" "}
            <span className="font-medium text-[var(--color-text)]">
              {totalResults === 0 ? 0 : startIndex + 1}
            </span>
            {" "}to{" "}
            <span className="font-medium text-[var(--color-text)]">
              {Math.min(endIndex, totalResults)}
            </span>
            {" "}of{" "}
            <span className="font-medium text-[var(--color-text)]">
              {totalResults}
            </span>
          </p>

          {pageSize !== "all" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPreviousPage}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  hasPreviousPage
                    ? "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)]"
                    : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
                }`}
              >
                Previous
              </button>

              <span className="px-2 text-sm text-[var(--color-muted)]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNextPage}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  hasNextPage
                    ? "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)]"
                    : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]"
                }`}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}