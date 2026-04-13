import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPlanReminderEmail } from "@/lib/email/templates/plan-reminder";

type PlanRow = {
  id: string;
  user_id: string;
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

type ProfileRow = {
  id: string;
  name: string | null;
  notification_email_reminders: boolean | null;
  timezone: string | null;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetweenInclusive(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(diff / msPerDay) + 1;
}

function isPlanDueToday(plan: PlanRow, now: Date) {
  if (!plan.start_date) return false;

  const start = startOfDay(new Date(plan.start_date));
  const today = startOfDay(now);

  if (Number.isNaN(start.getTime())) return false;
  if (start > today) return false;

  if (plan.end_date) {
    const end = startOfDay(new Date(plan.end_date));
    if (!Number.isNaN(end.getTime()) && today > end) return false;
  }

  const frequencyType = (plan.frequency_type ?? "daily").toLowerCase();
  const frequencyValue =
    typeof plan.frequency_value === "number" && plan.frequency_value > 0
      ? plan.frequency_value
      : 1;

  const totalDays = daysBetweenInclusive(start, today) - 1;

  if (frequencyType === "daily") {
    return totalDays % frequencyValue === 0;
  }

  if (frequencyType === "weekly") {
    const intervalDays = frequencyValue * 7;
    return totalDays % intervalDays === 0;
  }

  return totalDays % frequencyValue === 0;
}

function getScheduledDateTime(plan: PlanRow, now: Date) {
  const today = startOfDay(now);
  const [hours, minutes] = (plan.default_time ?? "09:00")
    .split(":")
    .map((part) => Number(part));

  const scheduled = new Date(today);
  scheduled.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );

  return scheduled;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date();

    const { data: plans, error: plansError } = await supabase
      .from("injection_plans")
      .select(`
        id,
        user_id,
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
      `)
      .eq("active", true)
      .eq("reminders_enabled", true);

    if (plansError) {
      console.error("Reminder plans query error:", plansError);
      return NextResponse.json(
        { ok: false, error: "Plans query failed" },
        { status: 500 }
      );
    }

    let sent = 0;
    let skipped = 0;

    for (const plan of (plans ?? []) as PlanRow[]) {
      if (!isPlanDueToday(plan, now)) {
        skipped += 1;
        continue;
      }

      const scheduledFor = getScheduledDateTime(plan, now);
      const offsetHours =
        typeof plan.reminder_offset_hours === "number"
          ? plan.reminder_offset_hours
          : 0;

      const reminderAt = new Date(
        scheduledFor.getTime() - offsetHours * 60 * 60 * 1000
      );

      const diffMs = Math.abs(now.getTime() - reminderAt.getTime());
      const withinWindow = diffMs <= 15 * 60 * 1000;

      if (!withinWindow) {
        skipped += 1;
        continue;
      }

      const { data: existingLog, error: logLookupError } = await supabase
        .from("reminder_email_logs")
        .select("id")
        .eq("plan_id", plan.id)
        .eq("scheduled_for", reminderAt.toISOString())
        .eq("kind", "plan_reminder")
        .maybeSingle();

      if (logLookupError) {
        console.error("Reminder log lookup error:", logLookupError);
      }

      if (existingLog) {
        skipped += 1;
        continue;
      }

      const [{ data: profile }, { data: authUserResult }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, notification_email_reminders, timezone")
          .eq("id", plan.user_id)
          .maybeSingle(),
        supabase.auth.admin.getUserById(plan.user_id),
      ]);

      const typedProfile = profile as ProfileRow | null;
      const email = authUserResult.user?.email ?? null;

      if (!typedProfile?.notification_email_reminders || !email) {
        skipped += 1;
        continue;
      }

      const emailContent = getPlanReminderEmail({
        userName: typedProfile.name,
        planName: plan.plan_name ?? "Injection plan",
        doseAmount: plan.dose_amount,
        doseUnit: plan.dose_unit,
        scheduledLabel: reminderAt.toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });

      await sendPeptiqEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      const { error: insertLogError } = await supabase
        .from("reminder_email_logs")
        .insert({
          user_id: plan.user_id,
          plan_id: plan.id,
          scheduled_for: reminderAt.toISOString(),
          kind: "plan_reminder",
        });

      if (insertLogError) {
        console.error("Reminder log insert error:", insertLogError);
      }

      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      checked: plans?.length ?? 0,
      sent,
      skipped,
    });
  } catch (error) {
    console.error("Plan reminders cron error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected reminder failure" },
      { status: 500 }
    );
  }
}