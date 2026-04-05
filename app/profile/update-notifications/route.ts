import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const formData = await request.formData();

  const email_reminders = formData.get("email_reminders") === "on";
  const missed_reminder_alerts =
    formData.get("missed_reminder_alerts") === "on";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email_reminders,
    missed_reminder_alerts,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/profile?success=notifications-updated");
}