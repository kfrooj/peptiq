"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type InjectionHistoryRow = {
  id: string;
  injection_at: string;
  dose_amount: number;
  dose_unit: string;
  peptide_name: string;
};

type Props = {
  logs: InjectionHistoryRow[];
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getUniquePeptides(logs: InjectionHistoryRow[]) {
  return Array.from(new Set(logs.map((log) => log.peptide_name))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export default function InjectionHistoryTable({ logs }: Props) {
  const [search, setSearch] = useState("");
  const [selectedPeptide, setSelectedPeptide] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "specific"
  >("all");
  const [specificDate, setSpecificDate] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const peptides = useMemo(() => getUniquePeptides(logs), [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const searchLower = search.trim().toLowerCase();

    return logs.filter((log) => {
      const logDate = new Date(log.injection_at);

      const matchesSearch =
        !searchLower ||
        log.peptide_name.toLowerCase().includes(searchLower) ||
        `${log.dose_amount} ${log.dose_unit}`.toLowerCase().includes(searchLower);

      const matchesPeptide =
        !selectedPeptide || log.peptide_name === selectedPeptide;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = logDate >= startOfDay(now) && logDate <= endOfDay(now);
      } else if (dateFilter === "week") {
        matchesDate = logDate >= startOfWeek(now) && logDate <= endOfDay(now);
      } else if (dateFilter === "month") {
        matchesDate = logDate >= startOfMonth(now) && logDate <= endOfDay(now);
      } else if (dateFilter === "specific") {
        if (!specificDate) {
          matchesDate = false;
        } else {
          const selected = new Date(specificDate);
          matchesDate =
            logDate >= startOfDay(selected) && logDate <= endOfDay(selected);
        }
      }

      return matchesSearch && matchesPeptide && matchesDate;
    });
  }, [logs, search, selectedPeptide, dateFilter, specificDate]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedPeptide !== "" ||
    dateFilter !== "all";

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Injection History
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Compact, searchable history of your recent logged injections.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(20);
            }}
            placeholder="Search peptide or dose"
            className="col-span-full lg:col-span-1 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:bg-white"
          />

          <select
            value={selectedPeptide}
            onChange={(e) => {
              setSelectedPeptide(e.target.value);
              setVisibleCount(20);
            }}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:bg-white"
          >
            <option value="">All peptides</option>
            {peptides.map((peptide) => (
              <option key={peptide} value={peptide}>
                {peptide}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(
                e.target.value as "all" | "today" | "week" | "month" | "specific"
              );
              setVisibleCount(20);
              if (e.target.value !== "specific") {
                setSpecificDate("");
              }
            }}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:bg-white"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="specific">Specific date</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedPeptide("");
              setDateFilter("all");
              setSpecificDate("");
              setVisibleCount(20);
            }}
            className="w-full lg:w-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:bg-white"
          >
            Clear filters
          </button>
        </div>

        {dateFilter === "specific" ? (
          <div className="grid gap-3 sm:grid-cols-[220px_auto]">
            <input
              type="date"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                setVisibleCount(20);
              }}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:bg-white"
            />

            <div className="flex items-center">
              <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                Date: {specificDate || "Select a date"}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {search.trim() ? (
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
              Search: {search.trim()}
            </span>
          ) : null}

          {selectedPeptide ? (
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
              Peptide: {selectedPeptide}
            </span>
          ) : null}

          {dateFilter !== "all" ? (
            <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
              Date:{" "}
              {dateFilter === "today"
                ? "Today"
                : dateFilter === "week"
                  ? "This week"
                  : dateFilter === "month"
                    ? "This month"
                    : specificDate || "Select a date"}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] gap-3 bg-[var(--color-surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] md:grid">
          <div>Peptide</div>
          <div>Injection date/time</div>
          <div>Dosage</div>
          <div>Actions</div>
        </div>

        {!visibleLogs.length ? (
          <div className="p-6 text-sm text-[var(--color-muted)]">
            No injections match your filters.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {visibleLogs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {log.peptide_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {formatDateTime(log.injection_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {log.dose_amount} {log.dose_unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-start md:justify-end">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      ✓ Done
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredLogs.length > visibleCount ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 20)}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Show 20 more
          </button>
        </div>
      ) : null}
    </section>
  );
}