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

const ALLOWED_DOSE_UNITS = new Set(["mcg", "mg", "IU", "mL"]);
const ALLOWED_FREQUENCY_TYPES = new Set(["daily", "weekly", "every_x_days"]);

function getMaxActivePlans(planTier: PlanTier): number | null {
  return planTier === "pro" ? null : 2;
}

function isValidDateString(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value);
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

function revalidatePlanRelatedPaths() {
  revalidatePath("/plans");
  revalidatePath("/dashboard");
  revalidatePath("/wellness");
  revalidatePath("/log-injection");
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

  if (!input.doseUnit || !ALLOWED_DOSE_UNITS.has(input.doseUnit)) {
    return { success: false, error: "Please select a valid dose unit." };
  }

  if (!input.frequencyType || !ALLOWED_FREQUENCY_TYPES.has(input.frequencyType)) {
    return { success: false, error: "Please select a valid frequency." };
  }

  if (!input.startDate || !isValidDateString(input.startDate)) {
    return { success: false, error: "Start date is required." };
  }

  if (input.endDate && !isValidDateString(input.endDate)) {
    return { success: false, error: "Please enter a valid end date." };
  }

  if (
    input.startDate &&
    input.endDate &&
    new Date(input.endDate).getTime() < new Date(input.startDate).getTime()
  ) {
    return {
      success: false,
      error: "End date cannot be earlier than the start date.",
    };
  }

  if (!input.defaultTime || !isValidTimeString(input.defaultTime)) {
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
    console.error("Create injection plan error:", error);

    return {
      success: false,
      error: "Could not create plan. Please try again.",
    };
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

  revalidatePlanRelatedPaths();

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

  const { data: existingPlan, error: existingPlanError } = await supabase
    .from("injection_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPlanError) {
    console.error("Plan lookup before delete error:", existingPlanError);
    return { success: false, error: "Could not verify the plan." };
  }

  if (!existingPlan) {
    return { success: false, error: "Plan not found." };
  }

  const { error } = await supabase
    .from("injection_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete injection plan error:", error);

    return {
      success: false,
      error: "Could not delete plan.",
    };
  }

  revalidatePlanRelatedPaths();

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
        console.error("Current plan lookup error:", currentPlanError);
        return { success: false, error: "Could not verify the plan." };
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
    console.error("Toggle injection plan error:", error);

    return {
      success: false,
      error: `Could not ${nextActive ? "activate" : "archive"} plan.`,
    };
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

  revalidatePlanRelatedPaths();

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
    console.error("Mark reminder completed error:", error);

    return {
      success: false,
      error: "Could not mark reminder as completed.",
    };
  }

  revalidatePlanRelatedPaths();

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
    console.error("Delete reminder error:", error);

    return {
      success: false,
      error: "Could not delete reminder.",
    };
  }

  revalidatePlanRelatedPaths();

  return { success: true };
}