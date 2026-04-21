"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialQuery: string;
  initialCategory: string;
  categories: string[];
};

export default function AdminPeptideFilters({
  initialQuery,
  initialCategory,
  categories,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  function buildNextUrl(nextQuery: string, nextCategory: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextCategory.trim()) {
      params.set("category", nextCategory.trim());
    } else {
      params.delete("category");
    }

    // Only reset page when filters actually change
    params.delete("page");

    return params.toString() ? `${pathname}?${params.toString()}` : pathname;
  }

  // Debounce search only
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query === initialQuery) return;

      const next = buildNextUrl(query, category);
      const current = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (next !== current) {
        startTransition(() => {
          router.replace(next);
        });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, initialQuery, category, pathname, router, searchParams]);

  function handleCategoryChange(value: string) {
    setCategory(value);

    const next = buildNextUrl(query, value);

    startTransition(() => {
      router.replace(next);
    });
  }

  function handleReset() {
    setQuery("");
    setCategory("");

    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
      <div>
        <label
          htmlFor="q"
          className="mb-1 block text-sm font-medium text-[var(--color-text)]"
        >
          Search by name
        </label>
        <input
          id="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search peptides..."
          autoComplete="off"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-1 block text-sm font-medium text-[var(--color-text)]"
        >
          Filter by category
        </label>
        <select
          id="category"
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
        >
          Reset
        </button>

        {isPending ? (
          <span className="text-sm text-[var(--color-muted)]">Updating…</span>
        ) : null}
      </div>
    </div>
  );
}