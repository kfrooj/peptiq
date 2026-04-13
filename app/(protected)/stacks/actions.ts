"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SaveStackInput = {
  stackId?: string | null;
  name: string;
  items: {
    peptide_id: string;
    note: string;
    position: number;
  }[];
};

export async function saveStack(input: SaveStackInput) {
  const supabase = await createClient();

  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return { success: false, error: "Stack name is required." };
  }

  if (!input.items.length) {
    return { success: false, error: "Add at least one peptide before saving." };
  }

  let finalStackId = input.stackId ?? null;

  if (finalStackId) {
    const { error: updateError } = await supabase
      .from("stacks")
      .update({
        name: trimmedName,
      })
      .eq("id", finalStackId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Could not update stack.",
      };
    }

    const { error: deleteItemsError } = await supabase
      .from("stack_items")
      .delete()
      .eq("stack_id", finalStackId);

    if (deleteItemsError) {
      return {
        success: false,
        error: deleteItemsError.message || "Could not refresh stack items.",
      };
    }
  } else {
    const { data: stack, error: stackError } = await supabase
      .from("stacks")
      .insert({
        name: trimmedName,
      })
      .select("id")
      .single();

    if (stackError || !stack) {
      return {
        success: false,
        error: stackError?.message || "Could not create stack.",
      };
    }

    finalStackId = stack.id;
  }

  const itemsToInsert = input.items.map((item) => ({
    stack_id: finalStackId,
    peptide_id: item.peptide_id,
    note: item.note,
    position: item.position,
  }));

  const { error: itemsError } = await supabase
    .from("stack_items")
    .insert(itemsToInsert);

  if (itemsError) {
    return {
      success: false,
      error: itemsError.message,
    };
  }

  revalidatePath("/stacks");

  return {
    success: true,
    stackId: finalStackId,
    mode: input.stackId ? "updated" : "created",
  };
}

export async function deleteStack(stackId: string) {
  const supabase = await createClient();

  if (!stackId) {
    return { success: false, error: "Stack ID is required." };
  }

  const { error } = await supabase.from("stacks").delete().eq("id", stackId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/stacks");

  return { success: true };
}