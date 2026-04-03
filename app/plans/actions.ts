"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  notes?: string | null;
};

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

  const { error } = await supabase.from("injection_plans").insert({
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
    notes: input.notes || "",
  });

  if (error) {
    return { success: false, error: error.message };
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

  const { error } = await supabase
    .from("injection_plans")
    .update({
      active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/plans");

  return { success: true };
}