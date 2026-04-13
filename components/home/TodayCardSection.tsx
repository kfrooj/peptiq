import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type InjectionPlanRow = {
  id: string;
  user_id: string;
  peptide_id: string | null;
  plan_name: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency_type: string | null;
  frequency_value: number | null;
  start_date: string | null;
  end_date: string | null;
  default_time: string | null;
  active: boolean | null;
  reminders_enabled: boolean | null;
  reminder_offset_hours: number | null;
};

type InjectionLogRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  injection_at: string;
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

function daysBetweenInclusive(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(diff / msPerDay) + 1;
}

function isPlanDueOnDate(plan: InjectionPlanRow, targetDate: Date) {
  if (!plan.start_date) return false;

  const start = startOfDay(new Date(plan.start_date));
  const target = startOfDay(targetDate);

  if (Number.isNaN(start.getTime())) return false;
  if (start > target) return false;

  if (plan.end_date) {
    const end = startOfDay(new Date(plan.end_date));
    if (!Number.isNaN(end.getTime()) && target > end) return false;
  }

  const frequencyType = (plan.frequency_type ?? "daily").toLowerCase();
  const frequencyValue =
    typeof plan.frequency_value === "number" && plan.frequency_value > 0
      ? plan.frequency_value
      : 1;

  const totalDays = daysBetweenInclusive(start, target) - 1;

  if (frequencyType === "daily") {
    return totalDays % frequencyValue === 0;
  }

  if (frequencyType === "weekly") {
    const intervalDays = frequencyValue * 7;
    return totalDays % intervalDays === 0;
  }

  return totalDays % frequencyValue === 0;
}

function getPlanTimeLabel(defaultTime?: string | null) {
  if (!defaultTime) return "09:00";

  const [hours, minutes] = defaultTime.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "09:00";
  }

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function getPlanSortMinutes(defaultTime?: string | null) {
  if (!defaultTime) return 9 * 60;

  const [hours, minutes] = defaultTime.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 9 * 60;
  }

  return hours * 60 + minutes;
}

async function getTodayCardData(userId: string) {
  const supabase = await createClient();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [plansResult, logsTodayResult] = await Promise.all([
    supabase
      .from("injection_plans")
      .select(
        `
          id,
          user_id,
          peptide_id,
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
          reminder_offset_hours
        `
      )
      .eq("user_id", userId)
      .eq("active", true),

    supabase
      .from("injection_logs")
      .select("id, user_id, plan_id, injection_at")
      .eq("user_id", userId)
      .gte("injection_at", todayStart.toISOString())
      .lte("injection_at", todayEnd.toISOString()),
  ]);

  const plans = (plansResult.data ?? []) as InjectionPlanRow[];
  const logsToday = (logsTodayResult.data ?? []) as InjectionLogRow[];

  const dueToday = plans
    .filter((plan) => isPlanDueOnDate(plan, today))
    .sort(
      (a, b) =>
        getPlanSortMinutes(a.default_time) - getPlanSortMinutes(b.default_time)
    );

  const nextDuePlan = dueToday[0] ?? null;

  const completedTodayPlanIds = new Set(
    logsToday.map((log) => log.plan_id).filter(Boolean)
  );

  const dueTodayCount = dueToday.length;
  const completedTodayCount = dueToday.filter((plan) =>
    completedTodayPlanIds.has(plan.id)
  ).length;

  const adherence =
    dueTodayCount > 0
      ? `${Math.min(
          100,
          Math.round((completedTodayCount / dueTodayCount) * 100)
        )}%`
      : "—";

  return {
    activePlansCount: plans.length,
    injectionsLoggedToday: logsToday.length,
    dueTodayCount,
    completedTodayCount,
    adherence,
    nextDuePlan: nextDuePlan
      ? {
          id: nextDuePlan.id,
          planName: nextDuePlan.plan_name ?? "Injection plan",
          doseAmount: nextDuePlan.dose_amount,
          doseUnit: nextDuePlan.dose_unit,
          timeLabel: getPlanTimeLabel(nextDuePlan.default_time),
        }
      : null,
  };
}

export default async function TodayCardSection({
  userId,
}: {
  userId: string;
}) {
  const {
    activePlansCount,
    injectionsLoggedToday,
    dueTodayCount,
    completedTodayCount,
    adherence,
    nextDuePlan,
  } = await getTodayCardData(userId);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Today
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your next step and daily activity snapshot.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          View Dashboard
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        {nextDuePlan ? (
          <>
            <p className="text-sm text-[var(--color-muted)]">Next due</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Link
                  href={`/plans/${nextDuePlan.id}`}
                  className="block rounded-lg outline-none transition hover:opacity-80 focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <p className="text-lg font-semibold text-[var(--color-text)]">
                    {nextDuePlan.planName}
                  </p>
                </Link>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {nextDuePlan.doseAmount && nextDuePlan.doseUnit
                    ? `${nextDuePlan.doseAmount}${nextDuePlan.doseUnit} · `
                    : ""}
                  {nextDuePlan.timeLabel}
                </p>
              </div>

              <Link
                href={`/log-injection?planId=${nextDuePlan.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Log Now
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-muted)]">Next due</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              No injections due today
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              You’re all caught up for now.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <p className="text-sm text-[var(--color-muted)]">Active plans</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {activePlansCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <p className="text-sm text-[var(--color-muted)]">Logged today</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {injectionsLoggedToday}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <p className="text-sm text-[var(--color-muted)]">Due today</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {completedTodayCount}/{dueTodayCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <p className="text-sm text-[var(--color-muted)]">Today’s adherence</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {adherence}
          </p>
        </div>
      </div>
    </section>
  );
}