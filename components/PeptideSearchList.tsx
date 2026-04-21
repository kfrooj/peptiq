"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialSearch = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialPageSizeParam = searchParams.get("pageSize");
  const initialPageSize: PageSizeOption =
    initialPageSizeParam === "60"
      ? 60
      : initialPageSizeParam === "100"
      ? 100
      : initialPageSizeParam === "all"
      ? "all"
      : 30;

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

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

  const totalResults = filteredPeptides.length;
  const effectivePageSize = pageSize === "all" ? totalResults || 1 : pageSize;
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(totalResults / effectivePageSize));

  const currentPage = Math.min(page, totalPages);
  const startIndex =
    pageSize === "all" ? 0 : (currentPage - 1) * effectivePageSize;
  const endIndex =
    pageSize === "all" ? totalResults : startIndex + effectivePageSize;

  const visiblePeptides = filteredPeptides.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(search.trim() || selectedCategory);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  function buildUrl({
    nextSearch,
    nextCategory,
    nextPage,
    nextPageSize,
  }: {
    nextSearch: string;
    nextCategory: string;
    nextPage: number;
    nextPageSize: PageSizeOption;
  }) {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim());
    }

    if (nextCategory.trim()) {
      params.set("category", nextCategory.trim());
    }

    if (nextPageSize !== 30) {
      params.set("pageSize", String(nextPageSize));
    }

    if (nextPage > 1 && nextPageSize !== "all") {
      params.set("page", String(nextPage));
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = buildUrl({
        nextSearch: search,
        nextCategory: selectedCategory,
        nextPage: currentPage,
        nextPageSize: pageSize,
      });

      const current = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (next !== current) {
        startTransition(() => {
          router.replace(next, { scroll: false });
        });
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    search,
    selectedCategory,
    currentPage,
    pageSize,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, pageSize]);

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
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

          <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-muted)] sm:text-sm">
            <span>
              {totalResults} result{totalResults === 1 ? "" : "s"}
            </span>
            {isPending ? <span>Updating…</span> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.7fr_auto]">
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

            <select
              value={String(pageSize)}
              onChange={(e) => {
                const value = e.target.value;
                setPageSize(
                  value === "all" ? "all" : (Number(value) as 30 | 60 | 100)
                );
              }}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
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
              className="rounded-xl border px-3 py-2.5 text-sm"
            >
              Clear
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

      <div className="mt-5 divide-y">
        {visiblePeptides.map((peptide) => {
          const meta = getCategoryMeta(peptide.category);

          return (
            <div key={peptide.id} className="py-3">
              <div className="flex items-center justify-between gap-2 md:hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <p className="truncate text-sm font-semibold">
                    {peptide.name}
                  </p>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.style}`}
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

      {totalResults > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            Showing{" "}
            <span className="font-medium text-[var(--color-text)]">
              {totalResults === 0 ? 0 : startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-[var(--color-text)]">
              {Math.min(endIndex, totalResults)}
            </span>{" "}
            of{" "}
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