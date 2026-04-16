"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createUserNote(input: {
  title: string;
  content: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const title = input.title.trim();
  const content = input.content.trim();

  if (!content) {
    return { success: false, error: "Note content is required." };
  }

  const { error } = await supabase.from("user_notes").insert({
    user_id: user.id,
    title,
    content,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

export async function favoritePeptide(peptideId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const { error } = await supabase.from("favorite_peptides").insert({
    user_id: user.id,
    peptide_id: peptideId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true, alreadyExists: true };
    }

    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/peptides");

  return { success: true };
}

export async function unfavoritePeptide(peptideId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("favorite_peptides")
    .delete()
    .eq("user_id", user.id)
    .eq("peptide_id", peptideId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/peptides");

  return { success: true };
}

export async function favoriteStack(stackId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const { error } = await supabase.from("favorite_stacks").insert({
    user_id: user.id,
    stack_id: stackId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true, alreadyExists: true };
    }

    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stacks");

  return { success: true };
}

export async function unfavoriteStack(stackId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("favorite_stacks")
    .delete()
    .eq("user_id", user.id)
    .eq("stack_id", stackId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/stacks");

  return { success: true };
}