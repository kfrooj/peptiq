import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOccurrences, type InjectionPlan } from "./generateOccurrences";
import { subtractHours, toIsoString } from "./scheduleUtils";

const REMINDER_HORIZON_DAYS = 30;

type ReminderInsertRow = {
  user_id: string;
  plan_id: string;
  injection_plan_id: string;
  reminder_type: string;
  reminder_for: string;
  message: string;
  is_completed: boolean;
  scheduled_for: string;
  status: string;
  delivery_channel: string;
  recipient_email: string | null;
  subject: string | null;
  body: string | null;
  updated_at: string;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function buildReminderMessage(plan: InjectionPlan, occurrence: Date): string {
  const occurrenceLabel = occurrence.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `Upcoming injection scheduled for ${occurrenceLabel}.`;
}

export async function syncPlanReminders(
  supabase: SupabaseClient,
  plan: InjectionPlan
) {
  console.log("SYNC PLAN INPUT:", plan);

  const now = new Date();
  const windowStart = now;
  const windowEnd = addDays(now, REMINDER_HORIZON_DAYS);

  await deleteFuturePendingReminders(supabase, plan.id);

  if (!plan.is_active || !plan.reminders_enabled) {
    console.log("SYNC STOPPED: inactive or reminders disabled");
    return { created: 0, skipped: true };
  }

  const occurrences: Date[] = generateOccurrences(plan, windowStart, windowEnd);
  console.log("GENERATED OCCURRENCES:", occurrences);

  const rows: ReminderInsertRow[] = occurrences
    .map((occurrence: Date): ReminderInsertRow => {
      const scheduledFor = subtractHours(
        occurrence,
        plan.reminder_offset_hours || 24
      );

      return {
        user_id: plan.user_id,
        plan_id: plan.id,
        injection_plan_id: plan.id,
        reminder_type: "injection",
        reminder_for: toIsoString(occurrence),
        message: buildReminderMessage(plan, occurrence),
        is_completed: false,
        scheduled_for: toIsoString(scheduledFor),
        status: "pending",
        delivery_channel: "email",
        recipient_email: null,
        subject: null,
        body: null,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((row: ReminderInsertRow) => {
      return new Date(row.scheduled_for).getTime() > now.getTime();
    });

  console.log("ROWS TO INSERT:", rows);

  if (rows.length === 0) {
    return { created: 0, skipped: false };
  }

  const { error } = await supabase.from("plan_reminders").insert(rows);

  if (error) {
    console.error("PLAN REMINDERS INSERT ERROR:", error);
    throw error;
  }

  return { created: rows.length, skipped: false };
}

async function deleteFuturePendingReminders(
  supabase: SupabaseClient,
  planId: string
) {
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("plan_reminders")
    .delete()
    .eq("plan_id", planId)
    .eq("status", "pending")
    .gte("scheduled_for", nowIso);

  if (error) {
    console.error("DELETE FUTURE PENDING REMINDERS ERROR:", error);
    throw error;
  }
}