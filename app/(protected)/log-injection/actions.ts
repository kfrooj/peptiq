"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveReminderForLog } from "@/lib/reminders/resolveReminderForLog";

type CreateInjectionLogInput = {
  peptideId: string;
  planId?: string | null;
  injectionAt: string;
  doseAmount: number;
  doseUnit: string;
  site: string;
  notes?: string | null;
};

const ALLOWED_DOSE_UNITS = new Set(["mcg", "mg", "iu", "ml"]);

function isValidDateString(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export async function createInjectionLog(input: CreateInjectionLogInput) {
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

  if (!input.injectionAt) {
    return { success: false, error: "Injection date and time are required." };
  }

  if (!isValidDateString(input.injectionAt)) {
    return {
      success: false,
      error: "Please enter a valid injection date and time.",
    };
  }

  if (!input.doseAmount || input.doseAmount <= 0) {
    return { success: false, error: "Dose amount must be greater than 0." };
  }

  if (!input.doseUnit || !ALLOWED_DOSE_UNITS.has(input.doseUnit)) {
    return { success: false, error: "Please select a valid dose unit." };
  }

  if (!input.site.trim()) {
    return { success: false, error: "Please select an injection site." };
  }

  let resolvedPeptideId = input.peptideId;
  let resolvedPlanId: string | null = input.planId || null;

  if (resolvedPlanId) {
    const { data: plan, error: planError } = await supabase
      .from("injection_plans")
      .select("id, peptide_id, active, user_id")
      .eq("id", resolvedPlanId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError) {
      console.error("Plan lookup error:", planError);
      return {
        success: false,
        error: "Could not verify the selected plan.",
      };
    }

    if (!plan) {
  return {
    success: false,
    error: "The selected plan could not be found.",
  };
}

if (!plan.active) {
  return {
    success: false,
    error: "This plan is no longer active.",
  };
}

resolvedPeptideId = plan.peptide_id;
  }

  const { error } = await supabase.from("injection_logs").insert({
    user_id: user.id,
    peptide_id: resolvedPeptideId,
    plan_id: resolvedPlanId,
    injection_at: input.injectionAt,
    dose_amount: input.doseAmount,
    dose_unit: input.doseUnit,
    site: input.site.trim(),
    notes: input.notes?.trim() || "",
  });

  if (error) {
    console.error("Create injection log error:", error);

    return {
      success: false,
      error: "Could not log injection. Please try again.",
    };
  }

  try {
    const result = await resolveReminderForLog(supabase, {
      userId: user.id,
      planId: resolvedPlanId,
      injectionAt: input.injectionAt,
    });

    console.log("REMINDER RESOLUTION RESULT:", result);
  } catch (resolveError) {
    console.error("REMINDER RESOLUTION ERROR:", resolveError);
  }

  revalidatePath("/log-injection");
  revalidatePath("/dashboard");
  revalidatePath("/wellness");

  return { success: true };
}

export async function deleteInjectionLog(logId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!logId) {
    return { success: false, error: "Log ID is required." };
  }

  const { error } = await supabase
    .from("injection_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete injection log error:", error);

    return {
      success: false,
      error: "Could not delete injection log.",
    };
  }

  revalidatePath("/log-injection");
  revalidatePath("/dashboard");
  revalidatePath("/wellness");

  return { success: true };
}