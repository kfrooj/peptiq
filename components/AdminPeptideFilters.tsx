"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

  const currentParams = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(currentParams.toString());

      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }

      if (category.trim()) {
        params.set("category", category.trim());
      } else {
        params.delete("category");
      }

      params.delete("page");

      const next = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

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
  }, [query, category, pathname, router, searchParams, currentParams]);

  function handleCategoryChange(value: string) {
    setCategory(value);

    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (value.trim()) {
      params.set("category", value.trim());
    } else {
      params.delete("category");
    }

    params.delete("page");

    const next = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

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