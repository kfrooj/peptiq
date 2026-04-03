import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js";

type PlanRow = {
  id: string;
  user_id: string;
  plan_name: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  active: boolean;
  peptide: {
    name: string;
  }[] | { name: string } | null;
};

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    (startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / msPerDay
  );
}

function parsePlanDateTime(dateString: string, timeString?: string | null) {
  const safeTime = timeString && timeString.trim() ? timeString : "09:00";
  return new Date(`${dateString}T${safeTime}:00`);
}

function getPlanIntervalDays(plan: Pick<PlanRow, "frequency_type" | "frequency_value">) {
  if (plan.frequency_type === "weekly") return 7;
  if (plan.frequency_type === "every_x_days") {
    return Math.max(plan.frequency_value ?? 1, 1);
  }
  return 1;
}

function getDueDatesForNextDay(plan: PlanRow, now: Date) {
  const startDateTime = parsePlanDateTime(plan.start_date, plan.default_time);
  const endDateTime = plan.end_date
    ? parsePlanDateTime(plan.end_date, plan.default_time)
    : null;

  if (!plan.active) return [];
  if (endDateTime && endDateTime < startDateTime) return [];

  const intervalDays = getPlanIntervalDays(plan);
  const horizon = addDays(now, 1);

  const results: Date[] = [];
  let cursor = startDateTime;

  while (cursor <= horizon) {
    if (cursor >= now) {
      if (!endDateTime || cursor <= endDateTime) {
        results.push(new Date(cursor));
      }
    }
    cursor = addDays(cursor, intervalDays);
  }

  return results;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();

  const { data: plans, error: plansError } = await supabase
    .from("injection_plans")
    .select(
      `
        id,
        user_id,
        plan_name,
        frequency_type,
        frequency_value,
        start_date,
        end_date,
        default_time,
        active,
        peptide:peptides (
          name
        )
      `
    )
    .eq("active", true);

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  const remindersToInsert: {
    user_id: string;
    plan_id: string;
    reminder_type: string;
    reminder_for: string;
    message: string;
  }[] = [];

  for (const rawPlan of (plans ?? []) as PlanRow[]) {
    const peptide = normalizeSingleRelation<{ name: string }>(rawPlan.peptide);
    const dueDates = getDueDatesForNextDay(rawPlan, now);

    for (const dueDate of dueDates) {
      remindersToInsert.push({
        user_id: rawPlan.user_id,
        plan_id: rawPlan.id,
        reminder_type: "planned_injection",
        reminder_for: dueDate.toISOString(),
        message: `Planned injection due for ${peptide?.name || "your peptide"}: ${rawPlan.plan_name}`,
      });
    }
  }

  if (!remindersToInsert.length) {
    return NextResponse.json({ success: true, inserted: 0 });
  }

  for (const reminder of remindersToInsert) {
    const { data: existing } = await supabase
      .from("plan_reminders")
      .select("id")
      .eq("user_id", reminder.user_id)
      .eq("plan_id", reminder.plan_id)
      .eq("reminder_type", reminder.reminder_type)
      .eq("reminder_for", reminder.reminder_for)
      .maybeSingle();

    if (!existing) {
      await supabase.from("plan_reminders").insert(reminder);
    }
  }

  return NextResponse.json({
    success: true,
    attempted: remindersToInsert.length,
  });
}