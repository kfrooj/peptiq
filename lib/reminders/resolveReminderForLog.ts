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

export async function resolveReminderForLog(
  supabase: SupabaseClient,
  input: ResolveReminderForLogInput
) {
  if (!input.planId) {
    return { resolved: false, reason: "No plan linked to this injection log." };
  }

  const injectionTime = new Date(input.injectionAt);

  const windowStart = new Date(injectionTime);
  windowStart.setHours(windowStart.getHours() - 24);

  const windowEnd = new Date(injectionTime);
  windowEnd.setHours(windowEnd.getHours() + 24);

  const { data: reminders, error } = await supabase
    .from("plan_reminders")
    .select("id, reminder_for")
    .eq("user_id", input.userId)
    .eq("plan_id", input.planId)
    .eq("is_completed", false)
    .in("status", ["pending", "sent"])
    .gte("reminder_for", windowStart.toISOString())
    .lte("reminder_for", windowEnd.toISOString());

  if (error) {
    throw error;
  }

  if (!reminders || reminders.length === 0) {
    return { resolved: false, reason: "No matching reminder found." };
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