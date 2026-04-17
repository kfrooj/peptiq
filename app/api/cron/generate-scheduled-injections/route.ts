import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";

type PlanRow = {
  id: string;
  user_id: string;
  plan_name: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  active: boolean;
};

type ProfileRow = {
  id: string;
  timezone: string | null;
};

function addDays(date: DateTime, days: number) {
  return date.plus({ days });
}

function getPlanIntervalDays(plan: Pick<PlanRow, "frequency_type" | "frequency_value">) {
  if (plan.frequency_type === "weekly") return 7;
  if (plan.frequency_type === "every_x_days") {
    return Math.max(plan.frequency_value ?? 1, 1);
  }
  return 1;
}

function getScheduledOccurrencesForHorizon(
  plan: PlanRow,
  timezone: string,
  nowUtc: DateTime,
  horizonDays = 3
) {
  if (!plan.active || !plan.start_date) return [];

  const safeTime = plan.default_time?.trim() ? plan.default_time : "09:00";
  const [hour, minute] = safeTime.split(":").map(Number);

  const startLocal = DateTime.fromISO(plan.start_date, { zone: timezone }).set({
    hour: Number.isFinite(hour) ? hour : 9,
    minute: Number.isFinite(minute) ? minute : 0,
    second: 0,
    millisecond: 0,
  });

  if (!startLocal.isValid) return [];

  const endLocal = plan.end_date
    ? DateTime.fromISO(plan.end_date, { zone: timezone }).endOf("day")
    : null;

  if (endLocal && endLocal < startLocal) return [];

  const horizonLocal = nowUtc.setZone(timezone).plus({ days: horizonDays }).endOf("day");
  const intervalDays = getPlanIntervalDays(plan);

  const results: DateTime[] = [];
  let cursor = startLocal;

  while (cursor <= horizonLocal) {
    if (cursor >= nowUtc.setZone(timezone).startOf("day")) {
      if (!endLocal || cursor <= endLocal) {
        results.push(cursor);
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

  const nowUtc = DateTime.utc();

  const { data: plans, error: plansError } = await supabase
    .from("injection_plans")
    .select(`
      id,
      user_id,
      plan_name,
      frequency_type,
      frequency_value,
      start_date,
      end_date,
      default_time,
      dose_amount,
      dose_unit,
      active
    `)
    .eq("active", true);

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  const userIds = [...new Set((plans ?? []).map((plan) => plan.user_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, timezone")
    .in("id", userIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map<string, ProfileRow>(
    (profiles ?? []).map((profile) => [profile.id, profile as ProfileRow])
  );

  const rowsToInsert: {
    user_id: string;
    plan_id: string;
    scheduled_for: string;
    timezone: string;
    plan_name: string;
    dose_amount: number | null;
    dose_unit: string | null;
    status: string;
  }[] = [];

  for (const plan of (plans ?? []) as PlanRow[]) {
    const timezone = profileMap.get(plan.user_id)?.timezone || "UTC";

    const occurrences = getScheduledOccurrencesForHorizon(
      plan,
      timezone,
      nowUtc,
      3
    );

    for (const occurrenceLocal of occurrences) {
      rowsToInsert.push({
        user_id: plan.user_id,
        plan_id: plan.id,
        scheduled_for: occurrenceLocal.toUTC().toISO()!,
        timezone,
        plan_name: plan.plan_name ?? "Injection plan",
        dose_amount: plan.dose_amount,
        dose_unit: plan.dose_unit,
        status: "pending",
      });
    }
  }

  if (!rowsToInsert.length) {
    return NextResponse.json({ success: true, inserted: 0 });
  }

  const { error: insertError } = await supabase
    .from("scheduled_injections")
    .upsert(rowsToInsert, {
      onConflict: "plan_id,scheduled_for",
      ignoreDuplicates: true,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    attempted: rowsToInsert.length,
  });
}