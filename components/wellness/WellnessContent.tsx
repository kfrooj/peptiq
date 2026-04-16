import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type InjectionLog = {
  id: string;
  injection_at: string;
  site: string | null;
  peptide: {
    name: string;
  } | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

export default async function WellnessContent() {
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
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Recent Injections
        </h2>

        <div className="mt-4 space-y-3">
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
            typedLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-text)]">
                    {log.peptide?.name || "Injection"}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {log.site || "No site"}
                  </p>
                </div>

                <p className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatDate(log.injection_at)}
                </p>
              </div>
            ))
          )}
        </div>
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