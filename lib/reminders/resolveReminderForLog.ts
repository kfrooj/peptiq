import type { SupabaseClient } from "@supabase/supabase-js";

type ResolveReminderForLogInput = {
  userId: string;
  planId: string | null;
  injectionAt: string;
};

type ReminderCandidate = {
  id: string;
  reminder_for: string;
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

export async function resolveReminderForLog(
  supabase: SupabaseClient,
  input: ResolveReminderForLogInput
) {
  if (!input.planId) {
    return { resolved: false, reason: "No plan linked to this injection log." };
  }

  const injectionTime = new Date(input.injectionAt);

  if (Number.isNaN(injectionTime.getTime())) {
    return { resolved: false, reason: "Invalid injection time." };
  }

  const dayStart = startOfDay(injectionTime);
  const dayEnd = endOfDay(injectionTime);

  const { data: reminders, error } = await supabase
    .from("plan_reminders")
    .select("id, reminder_for")
    .eq("user_id", input.userId)
    .eq("plan_id", input.planId)
    .eq("is_completed", false)
    .in("status", ["pending", "sent"])
    .gte("reminder_for", dayStart.toISOString())
    .lte("reminder_for", dayEnd.toISOString());

  if (error) {
    throw error;
  }

  if (!reminders || reminders.length === 0) {
    return { resolved: false, reason: "No matching reminder found for this day." };
  }

  const closestReminder = reminders.reduce(
    (best: ReminderCandidate, current: ReminderCandidate) => {
      const bestDiff = Math.abs(
        new Date(best.reminder_for).getTime() - injectionTime.getTime()
      );
      const currentDiff = Math.abs(
        new Date(current.reminder_for).getTime() - injectionTime.getTime()
      );

      return currentDiff < bestDiff ? current : best;
    }
  );

  const { error: updateError } = await supabase
    .from("plan_reminders")
    .update({
      is_completed: true,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", closestReminder.id)
    .eq("user_id", input.userId);

  if (updateError) {
    throw updateError;
  }

  return { resolved: true, reminderId: closestReminder.id };
}