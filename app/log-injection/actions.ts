"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CreateInjectionLogInput = {
  peptideId: string;
  planId?: string | null;
  injectionAt: string;
  doseAmount: number;
  doseUnit: string;
  site: string;
  notes?: string | null;
};

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

  if (!input.doseAmount || input.doseAmount <= 0) {
    return { success: false, error: "Dose amount must be greater than 0." };
  }

  if (!input.site.trim()) {
    return { success: false, error: "Please select an injection site." };
  }

  const { error } = await supabase.from("injection_logs").insert({
    user_id: user.id,
    peptide_id: input.peptideId,
    plan_id: input.planId || null,
    injection_at: input.injectionAt,
    dose_amount: input.doseAmount,
    dose_unit: input.doseUnit,
    site: input.site,
    notes: input.notes || "",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/log-injection");
  revalidatePath("/dashboard");

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
    return { success: false, error: error.message };
  }

  revalidatePath("/log-injection");
  revalidatePath("/dashboard");

  return { success: true };
}