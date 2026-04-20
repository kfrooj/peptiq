import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";
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

type BillingProfile = {
  plan_tier?: string | null;
  subscription_status?: string | null;
};

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
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
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    days.push({
      key: formatLocalDateKey(date),
      label: shortFormatter.format(date),
      fullLabel: fullFormatter.format(date),
    });
  }

  return days;
}

function getTrendSummary(points: TrendPoint[]) {
  const valid = points.filter((p) => p.total > 0);

  if (valid.length < 2) return "Not enough data yet";

  const recent = valid.slice(-7);
  const earlier = valid.slice(-14, -7);

  if (!recent.length || !earlier.length) return "Building trend";

  const avg = (arr: TrendPoint[]) =>
    arr.reduce((sum, point) => sum + point.adherence, 0) / arr.length;

  if (avg(recent) >= avg(earlier) + 10) return "Improving";
  if (avg(recent) <= avg(earlier) - 10) return "Needs attention";
  return "Stable";
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayTime(value: string) {
  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) return value;

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(`1970-01-01T${hours}:${minutes}:00Z`));
}

function formatFrequencyLabel(
  frequencyType: string,
  frequencyValue: number | null
) {
  if (frequencyType === "every_x_days" && frequencyValue) {
    return `Every ${frequencyValue} days`;
  }

  if (frequencyType === "daily") {
    return "Daily";
  }

  if (frequencyType === "weekly") {
    return "Weekly";
  }

  return frequencyType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function PlansContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  sixtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    { data: profileData, error: profileError },
    { data: peptides, error: peptidesError },
    { data: rawPlans, error: plansError },
    { data: adherenceData, error: adherenceError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan_tier, subscription_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("peptides")
      .select("id, name, category")
      .eq("published", true)
      .order("name", { ascending: true }),
    supabase
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
      .order("created_at", { ascending: false }),
    supabase
      .from("plan_reminders")
      .select("id, plan_id, is_completed, reminder_for")
      .eq("user_id", user.id)
      .gte("reminder_for", sixtyDaysAgo.toISOString()),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (peptidesError) throw new Error(peptidesError.message);
  if (plansError) throw new Error(plansError.message);
  if (adherenceError) throw new Error(adherenceError.message);

  const planTier = getEffectivePlanTierForUser(
    user.email,
    (profileData ?? undefined) as BillingProfile | undefined
  );
  const maxPlans = planTier === "pro" ? null : 2;

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
  const reminderDetailsMap: Record<string, Record<string, ReminderDetail[]>> =
    {};

  for (const reminder of reminderRows) {
    const planId = reminder.plan_id;
    if (!planId) continue;

    const dayKey = formatLocalDateKey(new Date(reminder.reminder_for));
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
  const activePlans = plans.filter((p) => p.active);
  const activePlanCount = activePlans.length;
  const isAtLimit = maxPlans !== null && activePlanCount >= maxPlans;
  const isNearLimit = maxPlans !== null && activePlanCount === maxPlans - 1;
  const showUsageBanner = planTier === "free";

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Plans
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Manage active plans, track adherence, and keep your next step clear.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                planTier === "pro"
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {planTier === "pro" ? "Pro" : "Free"}
            </span>
          </div>
        </div>
      </div>

      {showUsageBanner ? (
        <section className="mb-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Using {activePlanCount} of {maxPlans} active plans
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {isAtLimit
                  ? "You’ve reached the Free plan limit. Upgrade to Pro for unlimited active plans, or archive an existing plan first."
                  : isNearLimit
                  ? "You’re close to the Free plan limit. Upgrade to Pro for unlimited active plans."
                  : "Free includes up to 2 active plans. Upgrade to Pro for unlimited active plans and expanded tracking."}
              </p>
            </div>

            <Link
              href="/pricing"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-white"
            >
              Upgrade
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                Create Plan
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Set up a new schedule and reminder pattern.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <NewInjectionPlanForm
              peptides={peptides ?? []}
              disabled={isAtLimit}
              disabledReason="Free includes up to 2 active plans. Upgrade to Pro for unlimited plans, or archive an existing plan first."
              upgradeHref="/pricing"
            />
          </div>
        </section>

        <section
          id="your-plans"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                Your Plans
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Scan active plans quickly and drill into adherence where needed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                {plans.length} total
              </span>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                {activePlanCount} active
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {!plans.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm text-[var(--color-muted)] sm:p-6">
                No plans yet. Create your first plan to start reminders and adherence tracking.
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
                  <article
                    key={plan.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 sm:p-5"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-[var(--color-text)] sm:text-lg">
                            {plan.plan_name}
                          </h3>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {plan.peptide?.name || "Unknown peptide"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              plan.active
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {plan.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-[var(--color-muted)] sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                            Dose
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            {plan.dose_amount} {plan.dose_unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                            Frequency
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            {formatFrequencyLabel(
                              plan.frequency_type,
                              plan.frequency_value
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                            Start
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            {formatDate(plan.start_date)}
                          </p>
                        </div>

                        {plan.end_date ? (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                              End
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--color-text)]">
                              {formatDate(plan.end_date)}
                            </p>
                          </div>
                        ) : null}

                        {plan.default_time ? (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                              Time
                            </p>
                            <p className="mt-0.5 text-sm text-[var(--color-text)]">
                              {formatDisplayTime(plan.default_time)}
                            </p>
                          </div>
                        ) : null}

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]/80">
                            Reminders
                          </p>
                          <p className="mt-0.5 text-sm text-[var(--color-text)]">
                            {plan.reminders_enabled
                              ? `${plan.reminder_offset_hours ?? 24}h before`
                              : "Off"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <div
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${adherenceStyles.bg} ${adherenceStyles.border} ${adherenceStyles.text}`}
                        >
                          <span>60-day adherence</span>
                          <span>{adherence}%</span>
                        </div>

                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {stats.total} total
                        </span>
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                          {stats.completed} completed
                        </span>
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          {stats.missed} missed
                        </span>
                      </div>

                      <div className="mt-2">
                        <PlanAdherenceSparkline
                          points={trend}
                          lineColor={adherenceStyles.line}
                          trendSummary={trendSummary}
                          trendLabel="60-DAY TREND"
                          reminderDetailsByDay={reminderDetailsByDay}
                          defaultDetailsOpen={false}
                        />
                        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                          Based on the last 60 days of reminders.
                        </p>
                      </div>

                      {plan.notes ? (
                        <div className="rounded-xl bg-white/70 px-3 py-1.5 text-xs text-[var(--color-muted)]">
                          <span className="font-medium text-[var(--color-text)]">
                            Notes:
                          </span>{" "}
                          {plan.notes}
                        </div>
                      ) : null}

                      <div className="flex justify-end pt-1">
                        <InjectionPlanActions
                          planId={plan.id}
                          active={plan.active}
                        />
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}