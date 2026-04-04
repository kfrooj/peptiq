import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WellnessFilters from "@/components/WellnessFilters";
import InjectionActivityChart from "@/components/InjectionActivityChart";
import SiteUsageBodyAreaChart from "@/components/SiteUsageBodyAreaChart";
import PeptideTimelineChart from "@/components/PeptideTimelineChart";
import MissedPlanReminderActions from "@/components/MissedPlanReminderActions";

type PeptideRelation = {
  id: string;
  name: string;
  category: string | null;
};

type InjectionLog = {
  id: string;
  injection_at: string;
  dose_amount: number;
  dose_unit: string;
  site: string;
  notes: string | null;
  plan_id: string | null;
  peptide: PeptideRelation | null;
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
  peptide: PeptideRelation | null;
};

type MissedPlanReminder = {
  reminderId: string;
  planId: string;
  planName: string;
  peptideName: string;
  dueAt: Date;
  status: string | null;
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

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDay = startOfLocalDay(start).getTime();
  const endDay = startOfLocalDay(end).getTime();
  return Math.floor((endDay - startDay) / msPerDay);
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

  const { data: rawMissedReminders, error: missedRemindersError } =
    await supabase
      .from("plan_reminders")
      .select(
        `
          id,
          plan_id,
          reminder_for,
          status,
          is_completed,
          plan:injection_plans (
            id,
            plan_name,
            peptide:peptides (
              id,
              name,
              category
            )
          )
        `
      )
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .in("status", ["pending", "sent"])
      .lt("reminder_for", new Date().toISOString())
      .order("reminder_for", { ascending: false });

  if (missedRemindersError) {
    throw new Error(missedRemindersError.message);
  }

  const typedLogs: InjectionLog[] = (logs ?? []).map((log: any) => ({
    id: log.id,
    injection_at: log.injection_at,
    dose_amount: log.dose_amount,
    dose_unit: log.dose_unit,
    site: log.site,
    notes: log.notes,
    plan_id: log.plan_id ?? null,
    peptide: normalizeSingleRelation<PeptideRelation>(log.peptide),
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
    peptide: normalizeSingleRelation<PeptideRelation>(plan.peptide),
  }));

  const missedPlanReminders: MissedPlanReminder[] = (
    rawMissedReminders ?? []
  ).map((reminder: any) => {
    const relatedPlan = normalizeSingleRelation<any>(reminder.plan);
    const relatedPeptide = normalizeSingleRelation<any>(relatedPlan?.peptide);

    return {
      reminderId: reminder.id,
      planId: reminder.plan_id,
      planName: relatedPlan?.plan_name || "Unknown plan",
      peptideName: relatedPeptide?.name || "Unknown peptide",
      dueAt: new Date(reminder.reminder_for),
      status: reminder.status ?? null,
    };
  });

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Wellness Tracker
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Review your injection history, patterns, adherence signals, and recent
          wellness notes.
        </p>
      </div>

      <WellnessFilters peptides={peptideOptions ?? []} sites={availableSites} />

      <div className="mt-4 sm:mt-6">
        <InjectionActivityChart data={chartData} />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-2 lg:gap-6">
        <SiteUsageBodyAreaChart data={bodyAreaChartData} />
        <PeptideTimelineChart
          days={peptideTimelineData.days}
          rows={peptideTimelineData.rows}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 md:grid-cols-2 xl:grid-cols-6">
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

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
          Missed-Plan Reminders
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          These reminders are based on planned injection times that have passed
          and have not yet been resolved.
        </p>

        <div className="mt-4 grid gap-4">
          {!missedPlanReminders.length ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
              No missed-plan reminders right now.
            </div>
          ) : (
            missedPlanReminders.map((reminder) => (
              <div
                key={reminder.reminderId}
                className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                      {reminder.planName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Peptide: {reminder.peptideName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Expected log due: {formatDate(reminder.dueAt)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-amber-600">
                      Status: {reminder.status || "unknown"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      You have not logged this planned injection yet.
                    </p>
                  </div>

                  <MissedPlanReminderActions reminderId={reminder.reminderId} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
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
                  ? `You currently have ${missedPlanReminders.length} unresolved planned injection reminder${
                      missedPlanReminders.length === 1 ? "" : "s"
                    }.`
                  : "No unresolved planned injections detected right now."
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Site Usage
          </h2>

          <div className="mt-4 grid gap-3">
            {!sortedSites.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
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

      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Injections by Peptide
          </h2>

          <div className="mt-4 grid gap-3">
            {!sortedPeptides.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
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

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Recent Notes
          </h2>

          <div className="mt-4 grid gap-4">
            {!recentNotes.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
                No injection notes yet.
              </div>
            ) : (
              recentNotes.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <p className="text-sm font-medium leading-6 text-[var(--color-text)]">
                    {log.peptide?.name || "Unknown peptide"} ·{" "}
                    {formatDate(log.injection_at)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Site: {log.site}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
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
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </p>
      <p className="mt-2 break-words text-xl font-bold text-[var(--color-text)] sm:text-2xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        {subtitle}
      </p>
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