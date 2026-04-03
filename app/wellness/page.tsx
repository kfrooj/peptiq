import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WellnessFilters from "@/components/WellnessFilters";
import InjectionActivityChart from "@/components/InjectionActivityChart";
import SiteUsageBodyAreaChart from "@/components/SiteUsageBodyAreaChart";
import PeptideTimelineChart from "@/components/PeptideTimelineChart";

type InjectionLog = {
  id: string;
  injection_at: string;
  dose_amount: number;
  dose_unit: string;
  site: string;
  notes: string | null;
  plan_id: string | null;
  peptide: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

type InjectionPlan = {
  id: string;
  plan_name: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  active: boolean;
  peptide: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

type MissedPlanReminder = {
  planId: string;
  planName: string;
  peptideName: string;
  dueAt: Date;
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString();
}

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDay = startOfLocalDay(start).getTime();
  const endDay = startOfLocalDay(end).getTime();
  return Math.floor((endDay - startDay) / msPerDay);
}

function parsePlanDateTime(dateString: string, timeString?: string | null) {
  const safeTime = timeString && timeString.trim() ? timeString : "12:00";
  return new Date(`${dateString}T${safeTime}:00`);
}

function getPlanIntervalDays(plan: InjectionPlan) {
  if (plan.frequency_type === "weekly") return 7;
  if (plan.frequency_type === "every_x_days") {
    return Math.max(plan.frequency_value ?? 1, 1);
  }
  return 1;
}

function getMostRecentDueDate(plan: InjectionPlan, now: Date) {
  if (!plan.active) return null;

  const startDateTime = parsePlanDateTime(plan.start_date, plan.default_time);
  const endDateTime = plan.end_date
    ? parsePlanDateTime(plan.end_date, plan.default_time)
    : null;

  if (startDateTime > now) return null;
  if (endDateTime && endDateTime < startDateTime) return null;

  const intervalDays = getPlanIntervalDays(plan);
  const dayDiff = daysBetween(startDateTime, now);

  if (dayDiff < 0) return null;

  const stepCount = Math.floor(dayDiff / intervalDays);
  let dueDate = addDays(startDateTime, stepCount * intervalDays);

  if (dueDate > now) {
    dueDate = addDays(dueDate, -intervalDays);
  }

  if (dueDate < startDateTime) return null;
  if (endDateTime && dueDate > endDateTime) return null;

  return dueDate;
}

function getNextDueDate(plan: InjectionPlan, dueDate: Date) {
  const intervalDays = getPlanIntervalDays(plan);
  return addDays(dueDate, intervalDays);
}

function getDaysSinceLastInjection(logs: InjectionLog[]) {
  if (!logs.length) return null;

  const latest = new Date(logs[0].injection_at);
  return daysBetween(latest, new Date());
}

function getCurrentLoggingStreak(logs: InjectionLog[]) {
  if (!logs.length) return 0;

  const uniqueDays = Array.from(
    new Set(logs.map((log) => formatLocalDateKey(new Date(log.injection_at))))
  ).sort((a, b) => (a > b ? -1 : 1));

  if (!uniqueDays.length) return 0;

  const today = startOfLocalDay(new Date());
  const latestLoggedDay = startOfLocalDay(new Date(`${uniqueDays[0]}T00:00:00`));
  const gapFromToday = daysBetween(latestLoggedDay, today);

  if (gapFromToday > 1) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const previous = startOfLocalDay(new Date(`${uniqueDays[i - 1]}T00:00:00`));
    const current = startOfLocalDay(new Date(`${uniqueDays[i]}T00:00:00`));

    if (daysBetween(current, previous) === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getMissedPlanReminders(
  plans: InjectionPlan[],
  logs: InjectionLog[],
  now: Date
) {
  const reminders: MissedPlanReminder[] = [];

  for (const plan of plans) {
    if (!plan.active) continue;

    const dueDate = getMostRecentDueDate(plan, now);
    if (!dueDate) continue;

    if (dueDate > now) continue;

    const nextDueDate = getNextDueDate(plan, dueDate);

    const hasLogForWindow = logs.some((log) => {
      if (log.plan_id !== plan.id) return false;

      const loggedAt = new Date(log.injection_at);
      return loggedAt >= dueDate && loggedAt < nextDueDate;
    });

    if (!hasLogForWindow) {
      reminders.push({
        planId: plan.id,
        planName: plan.plan_name,
        peptideName: plan.peptide?.name || "Unknown peptide",
        dueAt: dueDate,
      });
    }
  }

  return reminders.sort((a, b) => b.dueAt.getTime() - a.dueAt.getTime());
}

function getLast7Days() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
  });

  const today = new Date();
  const days: { key: string; label: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);

    days.push({
      key: formatLocalDateKey(date),
      label: formatter.format(date),
    });
  }

  return days;
}

function getLast7DaysChartData(logs: InjectionLog[]) {
  const days = getLast7Days().map((day) => ({
    ...day,
    value: 0,
  }));

  for (const log of logs) {
    const key = formatLocalDateKey(new Date(log.injection_at));
    const match = days.find((day) => day.key === key);

    if (match) {
      match.value += 1;
    }
  }

  return days.map(({ label, value }) => ({
    label,
    value,
  }));
}

function normalizeBodyArea(site: string) {
  const value = site.toLowerCase();

  if (value.includes("abdomen")) return "Abdomen";
  if (value.includes("thigh")) return "Thigh";
  if (value.includes("glute")) return "Glute";
  if (value.includes("arm")) return "Arm";
  return "Other";
}

function getBodyAreaChartData(logs: InjectionLog[]) {
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    const area = normalizeBodyArea(log.site || "Other");
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
    }));
}

function getPeptideTimelineData(logs: InjectionLog[]) {
  const days = getLast7Days();

  const peptideMap: Record<string, number[]> = {};

  for (const log of logs) {
    const peptideName = log.peptide?.name || "Unknown peptide";
    const dayKey = formatLocalDateKey(new Date(log.injection_at));
    const dayIndex = days.findIndex((day) => day.key === dayKey);

    if (dayIndex === -1) continue;

    if (!peptideMap[peptideName]) {
      peptideMap[peptideName] = new Array(days.length).fill(0);
    }

    peptideMap[peptideName][dayIndex] += 1;
  }

  const rows = Object.entries(peptideMap)
    .map(([peptide, values]) => ({
      peptide,
      values,
      total: values.reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .map(({ peptide, values }) => ({
      peptide,
      values,
    }));

  return {
    days,
    rows,
  };
}

export default async function WellnessPage({
  searchParams,
}: {
  searchParams: Promise<{
    peptideId?: string;
    site?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const { peptideId, site, startDate, endDate } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: peptideOptions, error: peptideOptionsError } = await supabase
    .from("peptides")
    .select("id, name")
    .eq("published", true)
    .order("name", { ascending: true });

  if (peptideOptionsError) {
    throw new Error(peptideOptionsError.message);
  }

  let logsQuery = supabase
    .from("injection_logs")
    .select(
      `
        id,
        injection_at,
        dose_amount,
        dose_unit,
        site,
        notes,
        plan_id,
        peptide:peptides (
          id,
          name,
          category
        )
      `
    )
    .eq("user_id", user.id)
    .order("injection_at", { ascending: false });

  if (peptideId) {
    logsQuery = logsQuery.eq("peptide_id", peptideId);
  }

  if (site) {
    logsQuery = logsQuery.eq("site", site);
  }

  if (startDate) {
    logsQuery = logsQuery.gte("injection_at", `${startDate}T00:00:00`);
  }

  if (endDate) {
    logsQuery = logsQuery.lte("injection_at", `${endDate}T23:59:59`);
  }

  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    throw new Error(logsError.message);
  }

  const { data: rawPlans, error: plansError } = await supabase
    .from("injection_plans")
    .select(
      `
        id,
        plan_name,
        frequency_type,
        frequency_value,
        start_date,
        end_date,
        default_time,
        active,
        peptide:peptides (
          id,
          name,
          category
        )
      `
    )
    .eq("user_id", user.id);

  if (plansError) {
    throw new Error(plansError.message);
  }

  const typedLogs: InjectionLog[] = (logs ?? []).map((log: any) => ({
    id: log.id,
    injection_at: log.injection_at,
    dose_amount: log.dose_amount,
    dose_unit: log.dose_unit,
    site: log.site,
    notes: log.notes,
    plan_id: log.plan_id ?? null,
    peptide: normalizeSingleRelation(log.peptide),
  }));

  const typedPlans: InjectionPlan[] = (rawPlans ?? []).map((plan: any) => ({
    id: plan.id,
    plan_name: plan.plan_name,
    frequency_type: plan.frequency_type,
    frequency_value: plan.frequency_value ?? null,
    start_date: plan.start_date,
    end_date: plan.end_date ?? null,
    default_time: plan.default_time ?? null,
    active: Boolean(plan.active),
    peptide: normalizeSingleRelation(plan.peptide),
  }));

  const totalInjections = typedLogs.length;
  const activePlans = typedPlans.filter((plan) => plan.active).length;

  const peptideCounts = typedLogs.reduce<Record<string, number>>((acc, log) => {
    const key = log.peptide?.name || "Unknown peptide";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const siteCounts = typedLogs.reduce<Record<string, number>>((acc, log) => {
    const key = log.site || "Unknown site";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sortedPeptides = Object.entries(peptideCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const sortedSites = Object.entries(siteCounts).sort((a, b) => b[1] - a[1]);

  const recentNotes = typedLogs.filter((log) => log.notes?.trim()).slice(0, 5);

  const lastInjection = typedLogs[0] || null;
  const mostUsedPeptide = sortedPeptides[0] || null;
  const mostUsedSite = sortedSites[0] || null;

  const availableSites = Array.from(
    new Set(
      (logs ?? [])
        .map((log: any) => log.site)
        .filter((value: string | null | undefined) => !!value)
    )
  ).sort();

  const chartData = getLast7DaysChartData(typedLogs);
  const bodyAreaChartData = getBodyAreaChartData(typedLogs);
  const peptideTimelineData = getPeptideTimelineData(typedLogs);

  const daysSinceLastInjection = getDaysSinceLastInjection(typedLogs);
  const currentLoggingStreak = getCurrentLoggingStreak(typedLogs);
  const missedPlanReminders = getMissedPlanReminders(
    typedPlans,
    typedLogs,
    new Date()
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Wellness Tracker
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Review your injection history, patterns, adherence signals, and recent wellness notes.
        </p>
      </div>

      <WellnessFilters peptides={peptideOptions ?? []} sites={availableSites} />

      <div className="mt-6">
        <InjectionActivityChart data={chartData} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SiteUsageBodyAreaChart data={bodyAreaChartData} />
        <PeptideTimelineChart
          days={peptideTimelineData.days}
          rows={peptideTimelineData.rows}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total injections"
          value={String(totalInjections)}
          subtitle="Filtered results"
        />
        <SummaryCard
          title="Active plans"
          value={String(activePlans)}
          subtitle="Plans currently running"
        />
        <SummaryCard
          title="Top peptide"
          value={mostUsedPeptide ? mostUsedPeptide[0] : "—"}
          subtitle={
            mostUsedPeptide
              ? `${mostUsedPeptide[1]} logged injection(s)`
              : "No data yet"
          }
        />
        <SummaryCard
          title="Top site"
          value={mostUsedSite ? mostUsedSite[0] : "—"}
          subtitle={
            mostUsedSite
              ? `${mostUsedSite[1]} logged injection(s)`
              : "No data yet"
          }
        />
        <SummaryCard
          title="Days since last"
          value={
            daysSinceLastInjection === null
              ? "—"
              : String(daysSinceLastInjection)
          }
          subtitle="Since your most recent logged injection"
        />
        <SummaryCard
          title="Logging streak"
          value={String(currentLoggingStreak)}
          subtitle="Consecutive calendar days logged"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">
          Missed-Plan Reminders
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          These reminders are based on active plans and linked injection logs.
        </p>

        <div className="mt-4 grid gap-4">
          {!missedPlanReminders.length ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
              No missed-plan reminders right now.
            </div>
          ) : (
            missedPlanReminders.map((reminder) => (
              <div
                key={`${reminder.planId}-${reminder.dueAt.toISOString()}`}
                className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
              >
                <p className="text-sm font-semibold text-amber-800">
                  {reminder.planName}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Peptide: {reminder.peptideName}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Expected log due: {formatDate(reminder.dueAt)}
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  You have not logged this planned injection yet.
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Quick Insights
          </h2>

          <div className="mt-4 grid gap-4">
            <InsightCard
              title="Last injection"
              content={
                lastInjection
                  ? `${lastInjection.peptide?.name || "Unknown peptide"} logged on ${formatDate(
                      lastInjection.injection_at
                    )}`
                  : "No injections logged yet for these filters."
              }
            />

            <InsightCard
              title="Most used peptide"
              content={
                mostUsedPeptide
                  ? `${mostUsedPeptide[0]} appears most often in the current filtered view with ${mostUsedPeptide[1]} recorded injection(s).`
                  : "No peptide trends available yet."
              }
            />

            <InsightCard
              title="Most used injection site"
              content={
                mostUsedSite
                  ? `${mostUsedSite[0]} is the most frequently logged site in the current filtered view with ${mostUsedSite[1]} recorded injection(s).`
                  : "No site trends available yet."
              }
            />

            <InsightCard
              title="Adherence signal"
              content={
                missedPlanReminders.length > 0
                  ? `You currently have ${missedPlanReminders.length} missed planned injection reminder${
                      missedPlanReminders.length === 1 ? "" : "s"
                    }.`
                  : "No missed planned injections detected right now."
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Site Usage
          </h2>

          <div className="mt-4 grid gap-3">
            {!sortedSites.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No site data yet.
              </div>
            ) : (
              sortedSites.map(([siteName, count]) => (
                <div
                  key={siteName}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {siteName}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                      {count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Injections by Peptide
          </h2>

          <div className="mt-4 grid gap-3">
            {!sortedPeptides.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No peptide data yet.
              </div>
            ) : (
              sortedPeptides.map(([name, count]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {name}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                      {count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Recent Notes
          </h2>

          <div className="mt-4 grid gap-4">
            {!recentNotes.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No injection notes yet.
              </div>
            ) : (
              recentNotes.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {log.peptide?.name || "Unknown peptide"} ·{" "}
                    {formatDate(log.injection_at)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Site: {log.site}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
                    {log.notes}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>
    </section>
  );
}

function InsightCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        {content}
      </p>
    </div>
  );
}