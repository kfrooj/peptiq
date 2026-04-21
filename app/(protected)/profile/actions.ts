"use server";

import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

async function deleteUserAppData(userId: string) {
  const supabase = await createServerClient();

  // Turn off any future notifications first
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      email_reminders: false,
      missed_reminder_alerts: false,
      notification_email_reminders: false,
      notification_missed_alerts: false,
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new Error(profileUpdateError.message);
  }

  // Delete app/user data.
  // Order matters a bit if you don't have full ON DELETE CASCADE everywhere.
  const operations = [
    supabase.from("plan_reminders").delete().eq("user_id", userId),
    supabase.from("injection_logs").delete().eq("user_id", userId),
    supabase.from("favorite_peptides").delete().eq("user_id", userId),
    supabase.from("favorite_stacks").delete().eq("user_id", userId),
    supabase.from("stacks").delete().eq("user_id", userId),
    supabase.from("injection_plans").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("id", userId),
  ];

  for (const op of operations) {
    const { error } = await op;
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function deleteMyAccount() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { success: false, error: userError.message };
  }

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    await deleteUserAppData(user.id);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not delete account data.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      error: "Missing Supabase admin environment variables.",
    };
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteAuthError) {
    return {
      success: false,
      error: deleteAuthError.message,
    };
  }

  await supabase.auth.signOut();

  redirect("/login?deleted=account");
}