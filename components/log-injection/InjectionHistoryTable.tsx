"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type InjectionActivityRow = {
  id: string;
  type: "done" | "missed" | "upcoming";
  peptide_name: string;
  scheduled_at: string;
  dose_amount?: number | null;
  dose_unit?: string | null;
  plan_id?: string | null;
  plan_name?: string | null;
};

type Props = {
  items: InjectionActivityRow[];
  initialStatus?: "upcoming" | "missed" | "done";
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
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getUniquePeptides(items: InjectionActivityRow[]) {
  return Array.from(new Set(items.map((item) => item.peptide_name))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function getActionLabel(type: InjectionActivityRow["type"]) {
  if (type === "done") return "Logged";
  if (type === "missed") return "Log now";
  return "Prepare";
}

export default function InjectionHistoryTable({
  items,
  initialStatus = "upcoming",
}: Props) {
  const [statusFilter, setStatusFilter] = useState<"upcoming" | "missed" | "done">(
    initialStatus
  );
  const [search, setSearch] = useState("");
  const [selectedPeptide, setSelectedPeptide] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "specific"
  >("all");
  const [specificDate, setSpecificDate] = useState("");
  const [pageSize, setPageSize] = useState<7 | 10>(7);
  const [currentPage, setCurrentPage] = useState(1);

  const peptides = useMemo(() => getUniquePeptides(items), [items]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, selectedPeptide, dateFilter, specificDate, pageSize]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const searchLower = search.trim().toLowerCase();

    return items.filter((item) => {
      const itemDate = new Date(item.scheduled_at);

      const matchesStatus = item.type === statusFilter;

      const matchesSearch =
        !searchLower ||
        item.peptide_name.toLowerCase().includes(searchLower) ||
        `${item.dose_amount ?? ""} ${item.dose_unit ?? ""}`
          .toLowerCase()
          .includes(searchLower) ||
        (item.plan_name ?? "").toLowerCase().includes(searchLower);

      const matchesPeptide =
        !selectedPeptide || item.peptide_name === selectedPeptide;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = itemDate >= startOfDay(now) && itemDate <= endOfDay(now);
      } else if (dateFilter === "week") {
        matchesDate = itemDate >= startOfWeek(now) && itemDate <= endOfDay(now);
      } else if (dateFilter === "month") {
        matchesDate = itemDate >= startOfMonth(now) && itemDate <= endOfDay(now);
      } else if (dateFilter === "specific") {
        if (!specificDate) {
          matchesDate = false;
        } else {
          const selected = new Date(specificDate);
          matchesDate =
            itemDate >= startOfDay(selected) && itemDate <= endOfDay(selected);
        }
      }

      return matchesStatus && matchesSearch && matchesPeptide && matchesDate;
    });
  }, [items, statusFilter, search, selectedPeptide, dateFilter, specificDate]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const visibleItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedPeptide !== "" ||
    dateFilter !== "all";

  const sectionDescription =
    statusFilter === "upcoming"
      ? "Planned injections that are still coming up."
      : statusFilter === "missed"
        ? "Missed injections that still need to be logged."
        : "Completed injections you have already logged.";

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Injection Activity
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {sectionDescription}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            {filteredItems.length} {filteredItems.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["upcoming", "missed", "done"] as const).map((status) => {
            const active = statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                {status === "upcoming"
                  ? "Upcoming"
                  : status === "missed"
                    ? "Missed"
                    : "Done"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search peptide, dose, or plan"
              title="Search peptide, dose, or plan"
              className="min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />

            <select
              value={selectedPeptide}
              onChange={(e) => setSelectedPeptide(e.target.value)}
              className="min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 pr-8 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
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
                if (e.target.value !== "specific") {
                  setSpecificDate("");
                }
              }}
              className="min-w-0 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 pr-8 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="specific">Specific date</option>
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size"
                className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]"
              >
                Show
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as 7 | 10)}
                className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              >
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedPeptide("");
                setDateFilter("all");
                setSpecificDate("");
                setPageSize(7);
                setCurrentPage(1);
              }}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Clear filters
            </button>
          </div>

          {dateFilter === "specific" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-[220px_auto]">
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:bg-white"
              />

              <div className="flex items-center">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                  Date: {specificDate || "Select a date"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
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
  <div
    className="grid gap-0 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]"
    style={{ gridTemplateColumns: "minmax(0, 2fr) 135px 92px 104px" }}
  >
    <div className="border-r border-[var(--color-border)] px-4 py-3 text-sm font-medium text-left text-[var(--color-text)]">
      Peptide + Plan
    </div>
    <div className="border-r border-[var(--color-border)] px-4 py-3 text-sm font-medium text-left text-[var(--color-text)]">
      Injection Date/Time
    </div>
    <div className="border-r border-[var(--color-border)] px-4 py-3 text-sm font-medium text-left text-[var(--color-text)]">
      Dosage
    </div>
    <div className="px-4 py-3 text-sm font-medium text-left text-[var(--color-text)]">
      Actions
    </div>
  </div>

  {!visibleItems.length ? (
    <div className="p-6 text-sm text-[var(--color-muted)]">
      No entries match your filters.
    </div>
  ) : (
    <div className="divide-y divide-[var(--color-border)]">
      {visibleItems.map((item) => {
        const actionHref =
          item.type === "done"
            ? null
            : `/log-injection?status=${item.type}&planId=${encodeURIComponent(
                item.plan_id ?? ""
              )}&injectionAt=${encodeURIComponent(item.scheduled_at)}`;

        return (
          <div
            key={item.id}
            className="grid gap-0"
            style={{ gridTemplateColumns: "minmax(0, 2fr) 135px 92px 104px" }}
          >
            <div className="min-w-0 border-r border-[var(--color-border)] px-4 py-3">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                {item.peptide_name}
              </p>
              {item.plan_name ? (
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                  {item.plan_name}
                </p>
              ) : null}
            </div>

            <div className="border-r border-[var(--color-border)] px-4 py-3">
              <p className="text-sm leading-5 text-[var(--color-text)]">
                {formatDateTime(item.scheduled_at)}
              </p>
            </div>

            <div className="border-r border-[var(--color-border)] px-4 py-3">
              <p className="whitespace-nowrap text-sm text-[var(--color-text)]">
                {item.dose_amount && item.dose_unit
                  ? `${item.dose_amount} ${item.dose_unit}`
                  : "—"}
              </p>
            </div>

            <div className="flex items-center px-4 py-3">
              {actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] whitespace-nowrap"
                >
                  {getActionLabel(item.type)}
                </Link>
              ) : (
                <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-700 whitespace-nowrap">
                  Logged
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>

      {filteredItems.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            Page {safeCurrentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={safeCurrentPage >= totalPages}
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}