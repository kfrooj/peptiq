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

function getCategoryMeta(category: string) {
  const value = category.toLowerCase();

  if (value.includes("fat") || value.includes("weight")) {
    return {
      style: "bg-emerald-50 text-emerald-700",
      icon: "🔥",
      label: "Weight",
    };
  }

  if (value.includes("healing") || value.includes("recovery")) {
    return {
      style: "bg-blue-50 text-blue-700",
      icon: "🛠️",
      label: "Healing",
    };
  }

  if (value.includes("cognitive") || value.includes("brain")) {
    return {
      style: "bg-purple-50 text-purple-700",
      icon: "🧠",
      label: "Cognitive",
    };
  }

  if (value.includes("longevity") || value.includes("anti")) {
    return {
      style: "bg-amber-50 text-amber-700",
      icon: "⏳",
      label: "Longevity",
    };
  }

  return {
    style: "bg-gray-100 text-gray-700",
    icon: "🧬",
    label: category,
  };
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

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
              Browse peptides
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Explore detailed reference pages and usage insights.
            </p>
          </div>

          <div className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">
            {totalResults} result{totalResults === 1 ? "" : "s"}
          </div>
        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
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
                setPage(1);
              }}
              className="rounded-xl border px-3 py-2.5 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="mt-5 divide-y">
        {visiblePeptides.map((peptide) => {
          const meta = getCategoryMeta(peptide.category);

          return (
            <div key={peptide.id} className="py-3">
              {/* MOBILE PREMIUM ROW */}
              <div className="flex items-center justify-between gap-2 md:hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <p className="truncate text-sm font-semibold">
                    {peptide.name}
                  </p>

                  <span
                    className={`inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.style}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                </div>

                <Link
                  href={`/peptides/${peptide.slug}`}
                  className="shrink-0 rounded-md border px-2 py-1 text-[11px]"
                >
                  View
                </Link>
              </div>

              {/* DESKTOP */}
              <div className="hidden md:grid md:grid-cols-[1.4fr_1fr_auto] md:items-center md:gap-3">
                <p className="truncate font-semibold">{peptide.name}</p>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${meta.style}`}
                >
                  {meta.icon} {meta.label}
                </span>

                <Link
                  href={`/peptides/${peptide.slug}`}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}