import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 12;

type InjectionLog = {
  id: string;
  injection_at: string;
  site: string | null;
  peptide: {
    name: string;
  } | null;
};

type SearchParams = Promise<{
  page?: string;
}>;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

export default async function WellnessContent({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params?.page) || 1);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: logs, error } = await supabase
    .from("injection_logs")
    .select(
      `
        id,
        injection_at,
        site,
        peptide:peptides(name)
      `
    )
    .eq("user_id", user.id)
    .order("injection_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const typedLogs: InjectionLog[] = (logs ?? []).map((l: any) => ({
    id: l.id,
    injection_at: l.injection_at,
    site: l.site ?? null,
    peptide: Array.isArray(l.peptide)
      ? l.peptide[0] ?? null
      : l.peptide ?? null,
  }));

  const total = typedLogs.length;
  const last = typedLogs[0] ? formatDate(typedLogs[0].injection_at) : "—";

  const peptideCounts = typedLogs.reduce<Record<string, number>>((acc, log) => {
    const name = log.peptide?.name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topEntry = Object.entries(peptideCounts)
    .filter(([name]) => name !== "Unknown")
    .sort((a, b) => b[1] - a[1])[0];

  const topPeptide = topEntry ? `${topEntry[0]} (${topEntry[1]})` : "—";

  const last7 = getLast7Days();

  const activity = last7.map((day) => {
    const count = typedLogs.filter((log) => {
      const d = new Date(log.injection_at);
      return d.toDateString() === day.toDateString();
    }).length;

    return {
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      count,
    };
  });

  const max = Math.max(...activity.map((a) => a.count), 1);

  const totalPages = Math.max(1, Math.ceil(typedLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleLogs = typedLogs.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Wellness Tracker
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Review your injection history and recent activity patterns.
        </p>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card title="Total injections" value={String(total)} />
        <Card title="Last injection" value={last} />
        <Card title="Top peptide" value={topPeptide} />
      </section>

      <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Last 7 Days
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Number of injections logged per day.
        </p>

        <div className="mt-5 grid grid-cols-7 gap-3 sm:gap-4">
          {activity.map((day) => (
            <div key={day.label} className="flex flex-col items-center">
              <div className="mb-1 text-xs text-[var(--color-muted)]">
                {day.count}
              </div>

              <div className="flex h-24 items-end">
                <div
                  className="w-6 rounded-t bg-[var(--color-accent)]"
                  title={`${day.count} injection${day.count === 1 ? "" : "s"}`}
                  style={{
                    height: `${(day.count / max) * 100}%`,
                    minHeight: day.count > 0 ? "10%" : "0%",
                  }}
                />
              </div>

              <div className="mt-1 text-xs text-[var(--color-muted)]">
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Recent Injections
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Your logged history, newest first.
            </p>
          </div>

          {typedLogs.length > 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Page {safePage} of {totalPages}
            </p>
          ) : null}
        </div>

        {!typedLogs.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)]">
            <p>No injections logged yet.</p>
            <Link
              href="/log-injection"
              className="mt-3 inline-flex items-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Log your first injection
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visibleLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[var(--color-border)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-text)]">
                        {log.peptide?.name || "Injection"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {log.site || "No site"}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs text-[var(--color-muted)] text-right">
                      {formatDate(log.injection_at)}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {formatDateTime(log.injection_at)}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                        <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                          Peptide
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                          Site
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                          Date
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleLogs.map((log) => {
                        const date = new Date(log.injection_at);

                        return (
                          <tr
                            key={log.id}
                            className="border-b last:border-b-0 hover:bg-[var(--color-surface-muted)]/50"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">
                              {log.peptide?.name || "Injection"}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                              {log.site || "No site"}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                              {date.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                              {date.toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <Pagination currentPage={safePage} totalPages={totalPages} />
          </>
        )}
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <p className="text-xs text-[var(--color-muted)]">{title}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <Link
        href={buildPageHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
          currentPage === 1
            ? "pointer-events-none border-[var(--color-border)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
        }`}
      >
        Previous
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page, index, pages) => {
            const prevPage = pages[index - 1];
            const showGap = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center gap-2">
                {showGap ? (
                  <span className="px-1 text-sm text-[var(--color-muted)]">
                    …
                  </span>
                ) : null}

                <Link
                  href={buildPageHref(page)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    page === currentPage
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {page}
                </Link>
              </div>
            );
          })}
      </div>

      <Link
        href={buildPageHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
          currentPage === totalPages
            ? "pointer-events-none border-[var(--color-border)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
        }`}
      >
        Next
      </Link>
    </div>
  );
}

function buildPageHref(page: number) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  const qs = params.toString();
  return qs ? `/wellness?${qs}` : "/wellness";
}