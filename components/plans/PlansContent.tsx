
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewInjectionPlanForm from "@/components/NewInjectionPlanForm";
import InjectionPlanActions from "@/components/InjectionPlanActions";
import PlanAdherenceSparkline from "@/components/PlanAdherenceSparkline";

type PeptideRelation = {
  id: string;
  name: string;
  category: string | null;
};

type InjectionPlan = {
  id: string;
  plan_name: string;
  dose_amount: number;
  dose_unit: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  active: boolean;
  reminders_enabled: boolean;
  reminder_offset_hours: number | null;
  notes: string | null;
  created_at: string;
  peptide: PeptideRelation | null;
};

type ReminderRow = {
  id: string;
  plan_id: string | null;
  is_completed: boolean;
  reminder_for: string;
};

type TrendPoint = {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  completed: number;
  adherence: number;
};

type ReminderDetail = {
  id: string;
  fullLabel: string;
  timeLabel: string;
  completed: boolean;
};

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeInjectionPlans(rawPlans: any[]): InjectionPlan[] {
  return rawPlans.map((plan) => ({
    id: plan.id,
    plan_name: plan.plan_name,
    dose_amount: plan.dose_amount,
    dose_unit: plan.dose_unit,
    frequency_type: plan.frequency_type,
    frequency_value: plan.frequency_value ?? null,
    start_date: plan.start_date,
    end_date: plan.end_date ?? null,
    default_time: plan.default_time ?? null,
    active: Boolean(plan.active),
    reminders_enabled: Boolean(plan.reminders_enabled),
    reminder_offset_hours: plan.reminder_offset_hours ?? null,
    notes: plan.notes ?? null,
    created_at: plan.created_at,
    peptide: normalizeSingleRelation<PeptideRelation>(plan.peptide),
  }));
}

function getAdherenceStyles(adherence: number) {
  if (adherence >= 80) {
    return {
      text: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      line: "#16a34a",
    };
  }

  if (adherence >= 50) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      line: "#d97706",
    };
  }

  return {
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    line: "#dc2626",
  };
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLast60Days() {
  const shortFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });

  const fullFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const today = new Date();
  const days: { key: string; label: string; fullLabel: string }[] = [];

  for (let i = 59; i >= 0; i--) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - i);

    days.push({
      key: formatLocalDateKey(date),
      label: shortFormatter.format(date),
      fullLabel: fullFormatter.format(date),
    });
  }

  return days;
}

function getTrendSummary(points: TrendPoint[]) {
  const daysWithData = points.filter((point) => point.total > 0);

  if (daysWithData.length < 2) {
    return "Not enough data yet";
  }

  const recent = daysWithData.slice(-7);
  const earlier = daysWithData.slice(-14, -7);

  if (!recent.length || !earlier.length) {
    return "Building trend";
  }

  const recentAvg =
    recent.reduce((sum, point) => sum + point.adherence, 0) / recent.length;
  const earlierAvg =
    earlier.reduce((sum, point) => sum + point.adherence, 0) / earlier.length;

  if (recentAvg >= earlierAvg + 10) return "Improving";
  if (recentAvg <= earlierAvg - 10) return "Needs attention";
  return "Stable";
}

function formatTimeLabel(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PlansContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  sixtyDaysAgo.setHours(0, 0, 0, 0);

  const { data: peptides, error: peptidesError } = await supabase
    .from("peptides")
    .select("id, name, category")
    .eq("published", true)
    .order("name", { ascending: true });

  if (peptidesError) {
    throw new Error(peptidesError.message);
  }

  const { data: rawPlans, error: plansError } = await supabase
    .from("injection_plans")
    .select(
      `
        id,
        plan_name,
        dose_amount,
        dose_unit,
        frequency_type,
        frequency_value,
        start_date,
        end_date,
        default_time,
        active,
        reminders_enabled,
        reminder_offset_hours,
        notes,
        created_at,
        peptide:peptides (
          id,
          name,
          category
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const { data: adherenceData, error: adherenceError } = await supabase
    .from("plan_reminders")
    .select("id, plan_id, is_completed, reminder_for")
    .eq("user_id", user.id)
    .gte("reminder_for", sixtyDaysAgo.toISOString());

  if (adherenceError) {
    throw new Error(adherenceError.message);
  }

  const reminderRows: ReminderRow[] = (adherenceData ?? []).map((row: any) => ({
    id: row.id,
    plan_id: row.plan_id ?? null,
    is_completed: Boolean(row.is_completed),
    reminder_for: row.reminder_for,
  }));

  const adherenceMap: Record<
    string,
    { total: number; completed: number; missed: number }
  > = {};

  for (const reminder of reminderRows) {
    const planId = reminder.plan_id;
    if (!planId) continue;

    if (!adherenceMap[planId]) {
      adherenceMap[planId] = {
        total: 0,
        completed: 0,
        missed: 0,
      };
    }

    adherenceMap[planId].total += 1;

    if (reminder.is_completed) {
      adherenceMap[planId].completed += 1;
    } else if (new Date(reminder.reminder_for) < new Date()) {
      adherenceMap[planId].missed += 1;
    }
  }

  const last60Days = getLast60Days();

  const trendMap: Record<string, TrendPoint[]> = {};
  const reminderDetailsMap: Record<string, Record<string, ReminderDetail[]>> = {};

  for (const reminder of reminderRows) {
    const planId = reminder.plan_id;
    if (!planId) continue;

    const reminderDate = new Date(reminder.reminder_for);
    const dayKey = formatLocalDateKey(reminderDate);

    const matchingDay = last60Days.find((day) => day.key === dayKey);
    if (!matchingDay) continue;

    if (!trendMap[planId]) {
      trendMap[planId] = last60Days.map((day) => ({
        key: day.key,
        label: day.label,
        fullLabel: day.fullLabel,
        total: 0,
        completed: 0,
        adherence: 0,
      }));
    }

    if (!reminderDetailsMap[planId]) {
      reminderDetailsMap[planId] = {};
    }

    if (!reminderDetailsMap[planId][dayKey]) {
      reminderDetailsMap[planId][dayKey] = [];
    }

    const bucket = trendMap[planId].find((day) => day.key === dayKey);
    if (!bucket) continue;

    bucket.total += 1;
    if (reminder.is_completed) {
      bucket.completed += 1;
    }

    reminderDetailsMap[planId][dayKey].push({
      id: reminder.id,
      fullLabel: matchingDay.fullLabel,
      timeLabel: formatTimeLabel(reminder.reminder_for),
      completed: reminder.is_completed,
    });
  }

  for (const planId of Object.keys(trendMap)) {
    trendMap[planId] = trendMap[planId].map((day) => ({
      ...day,
      adherence:
        day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
    }));
  }

  const plans = normalizeInjectionPlans(rawPlans ?? []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Injection Plans
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Create and manage your peptide injection plans.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Create New Plan
          </h2>

          <div className="mt-4">
            <NewInjectionPlanForm peptides={peptides ?? []} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Your Plans
          </h2>

          <div className="mt-4 grid gap-4">
            {!plans.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
                No injection plans yet.
              </div>
            ) : (
              plans.map((plan) => {
                const stats = adherenceMap[plan.id] || {
                  total: 0,
                  completed: 0,
                  missed: 0,
                };

                const adherence =
                  stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0;

                const adherenceStyles = getAdherenceStyles(adherence);

                const trend = trendMap[plan.id] || last60Days.map((day) => ({
                  key: day.key,
                  label: day.label,
                  fullLabel: day.fullLabel,
                  total: 0,
                  completed: 0,
                  adherence: 0,
                }));

                const trendSummary = `60-day trend: ${getTrendSummary(trend)}`;
                const reminderDetailsByDay = reminderDetailsMap[plan.id] || {};

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
                          {plan.plan_name}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                          Peptide: {plan.peptide?.name || "Unknown peptide"}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                          Dose: {plan.dose_amount} {plan.dose_unit}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                          Frequency:{" "}
                          {plan.frequency_type === "every_x_days" &&
                          plan.frequency_value
                            ? `Every ${plan.frequency_value} days`
                            : plan.frequency_type}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                          Start: {plan.start_date}
                        </p>

                        {plan.end_date ? (
                          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                            End: {plan.end_date}
                          </p>
                        ) : null}

                        {plan.default_time ? (
                          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                            Injection time: {plan.default_time}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                          Reminders:{" "}
                          {plan.reminders_enabled
                            ? `Enabled (${plan.reminder_offset_hours ?? 24}h before)`
                            : "Disabled"}
                        </p>

                        <div
                          className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${adherenceStyles.bg} ${adherenceStyles.border} ${adherenceStyles.text}`}
                        >
                          <span>60-day adherence</span>
                          <span>{adherence}%</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                            {stats.completed} completed
                          </span>
                          <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                            {stats.missed} missed
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                            {stats.total} total
                          </span>
                        </div>

                        <div className="mt-4">
                          <PlanAdherenceSparkline
                            points={trend}
                            lineColor={adherenceStyles.line}
                            trendSummary={trendSummary}
                            trendLabel="60-DAY TREND"
                            reminderDetailsByDay={reminderDetailsByDay}
                            defaultDetailsOpen={false}
                          />

                          <p className="mt-2 text-xs text-[var(--color-muted)]">
                            Based on the last 60 days of reminders.
                          </p>
                        </div>

                        {plan.notes ? (
                          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                            Notes: {plan.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-row items-center justify-between gap-3 lg:flex-col lg:items-end">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                            plan.active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {plan.active ? "Active" : "Inactive"}
                        </span>

                        <InjectionPlanActions
                          planId={plan.id}
                          active={plan.active}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}