"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncPlanReminders } from "@/lib/reminders/syncPlanReminders";
import type { InjectionPlan as ReminderInjectionPlan } from "@/lib/reminders/generateOccurrences";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";

type CreateInjectionPlanInput = {
  peptideId: string;
  planName: string;
  doseAmount: number;
  doseUnit: string;
  frequencyType: string;
  frequencyValue?: number | null;
  startDate: string;
  endDate?: string | null;
  defaultTime?: string | null;
  active: boolean;
  remindersEnabled: boolean;
  reminderOffsetHours: number;
  notes?: string | null;
};

type InjectionPlanRow = {
  id: string;
  user_id: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  active: boolean;
  reminders_enabled: boolean;
  reminder_offset_hours: number | null;
};

type BillingProfile = {
  plan_tier?: string | null;
  subscription_status?: string | null;
};

type PlanTier = "free" | "pro";

function getMaxActivePlans(planTier: PlanTier): number | null {
  return planTier === "pro" ? null : 2;
}

async function getBillingProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<BillingProfile | undefined> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan_tier, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? undefined) as BillingProfile | undefined;
}

async function getResolvedPlanTier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email?: string | null
): Promise<PlanTier> {
  const profile = await getBillingProfile(supabase, userId);
  return getEffectivePlanTierForUser(email, profile);
}

async function getActivePlanCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { count, error } = await supabase
    .from("injection_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function mapPlanRowToReminderPlan(plan: InjectionPlanRow): ReminderInjectionPlan {
  return {
    id: plan.id,
    user_id: plan.user_id,
    is_active: Boolean(plan.active),
    reminders_enabled: Boolean(plan.reminders_enabled),
    reminder_offset_hours: plan.reminder_offset_hours ?? 24,
    start_date: plan.start_date,
    end_date: plan.end_date ?? null,
    frequency_type:
      plan.frequency_type === "every_x_days"
        ? "every_n_days"
        : (plan.frequency_type as "daily" | "weekly" | "every_n_days"),
    frequency_interval: plan.frequency_value ?? 1,
    days_of_week: null,
    time_of_day: plan.default_time ?? "09:00:00",
  };
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function createInjectionPlan(input: CreateInjectionPlanInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!input.peptideId) {
    return { success: false, error: "Please select a peptide." };
  }

  if (!input.planName.trim()) {
    return { success: false, error: "Plan name is required." };
  }

  if (!input.doseAmount || input.doseAmount <= 0) {
    return { success: false, error: "Dose amount must be greater than 0." };
  }

  if (!input.startDate) {
    return { success: false, error: "Start date is required." };
  }

  if (!input.defaultTime) {
    return { success: false, error: "Injection time is required." };
  }

  if (
    input.frequencyType === "every_x_days" &&
    (!input.frequencyValue || input.frequencyValue < 1)
  ) {
    return {
      success: false,
      error: "Please enter a valid repeat interval.",
    };
  }

  if (
    input.remindersEnabled &&
    (!input.reminderOffsetHours || input.reminderOffsetHours < 1)
  ) {
    return {
      success: false,
      error: "Reminder offset must be at least 1 hour.",
    };
  }

  try {
    const planTier = await getResolvedPlanTier(supabase, user.id, user.email);
    const maxActivePlans = getMaxActivePlans(planTier);

    if (input.active && maxActivePlans !== null) {
      const activePlanCount = await getActivePlanCount(supabase, user.id);

      if (activePlanCount >= maxActivePlans) {
        return {
          success: false,
          error:
            "Free includes up to 2 active plans. Upgrade to Pro or archive an existing plan first.",
        };
      }
    }
  } catch (limitError) {
    return {
      success: false,
      error: `Could not verify your plan limit: ${getReadableErrorMessage(
        limitError
      )}`,
    };
  }

  const { data: plan, error } = await supabase
    .from("injection_plans")
    .insert({
      user_id: user.id,
      peptide_id: input.peptideId,
      plan_name: input.planName.trim(),
      dose_amount: input.doseAmount,
      dose_unit: input.doseUnit,
      frequency_type: input.frequencyType,
      frequency_value: input.frequencyValue ?? null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      default_time: input.defaultTime || null,
      active: input.active,
      reminders_enabled: input.remindersEnabled,
      reminder_offset_hours: input.remindersEnabled
        ? input.reminderOffsetHours
        : null,
      notes: input.notes?.trim() || "",
    })
    .select(
      `
        id,
        user_id,
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
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    const reminderPlan = mapPlanRowToReminderPlan(plan);
    const syncResult = await syncPlanReminders(supabase, reminderPlan);
    console.log("REMINDER SYNC RESULT:", syncResult);
  } catch (syncError) {
    console.error("REMINDER SYNC ERROR:", syncError);

    return {
      success: false,
      error: `Plan was created, but reminder generation failed: ${getReadableErrorMessage(
        syncError
      )}`,
    };
  }

  revalidatePath("/plans");

  return { success: true };
}

export async function deleteInjectionPlan(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!planId) {
    return { success: false, error: "Plan ID is required." };
  }

  const { error } = await supabase
    .from("injection_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/plans");

  return { success: true };
}

export async function toggleInjectionPlanActive(
  planId: string,
  nextActive: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!planId) {
    return { success: false, error: "Plan ID is required." };
  }

  try {
    const planTier = await getResolvedPlanTier(supabase, user.id, user.email);
    const maxActivePlans = getMaxActivePlans(planTier);

    if (nextActive && maxActivePlans !== null) {
      const activePlanCount = await getActivePlanCount(supabase, user.id);

      const { data: currentPlan, error: currentPlanError } = await supabase
        .from("injection_plans")
        .select("id, active")
        .eq("id", planId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentPlanError) {
        return { success: false, error: currentPlanError.message };
      }

      if (!currentPlan) {
        return { success: false, error: "Plan not found." };
      }

      const isAlreadyActive = Boolean(currentPlan.active);

      if (!isAlreadyActive && activePlanCount >= maxActivePlans) {
        return {
          success: false,
          error:
            "Free includes up to 2 active plans. Upgrade to Pro or archive an existing plan first.",
        };
      }
    }
  } catch (limitError) {
    return {
      success: false,
      error: `Could not verify your plan limit: ${getReadableErrorMessage(
        limitError
      )}`,
    };
  }

  const { data: plan, error } = await supabase
    .from("injection_plans")
    .update({
      active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("user_id", user.id)
    .select(
      `
        id,
        user_id,
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
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    const reminderPlan = mapPlanRowToReminderPlan(plan);
    const syncResult = await syncPlanReminders(supabase, reminderPlan);
    console.log("REMINDER SYNC RESULT AFTER TOGGLE:", syncResult);
  } catch (syncError) {
    console.error("REMINDER SYNC ERROR AFTER TOGGLE:", syncError);

    return {
      success: false,
      error: `Plan status updated, but reminder sync failed: ${getReadableErrorMessage(
        syncError
      )}`,
    };
  }

  revalidatePath("/plans");

  return { success: true };
}

export async function markReminderCompleted(reminderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!reminderId) {
    return { success: false, error: "Reminder ID is required." };
  }

  const { error } = await supabase
    .from("plan_reminders")
    .update({
      is_completed: true,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/plans");
  revalidatePath("/wellness");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteReminder(reminderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!reminderId) {
    return { success: false, error: "Reminder ID is required." };
  }

  const { error } = await supabase
    .from("plan_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/plans");
  revalidatePath("/wellness");
  revalidatePath("/dashboard");

  return { success: true };
}