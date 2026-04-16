import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPlanReminderEmail } from "@/lib/email/templates/plan-reminder";

type ReminderRow = {
  id: string;
  user_id: string;
  plan_id: string;
  scheduled_for: string;
  reminder_for: string;
  message: string;
  status: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  notification_email_reminders: boolean | null;
};

export async function GET(request: Request) {
  try {
    // 🔐 Cron protection
    const authHeader = request.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // ⏱ Fetch due reminders
    const { data: reminders, error } = await supabase
      .from("plan_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .limit(50);

    if (error) {
      console.error("Reminder fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const reminder of (reminders ?? []) as ReminderRow[]) {
      try {
        // 👤 Get profile + email
        const [{ data: profile }, { data: authUserResult }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, name, notification_email_reminders")
              .eq("id", reminder.user_id)
              .maybeSingle(),
            supabase.auth.admin.getUserById(reminder.user_id),
          ]);

        const typedProfile = profile as ProfileRow | null;
        const email = authUserResult.user?.email ?? null;

        if (!typedProfile?.notification_email_reminders || !email) {
          skipped += 1;
          continue;
        }

        // 📧 Build email
        const scheduledDate = new Date(reminder.reminder_for);

        const emailContent = getPlanReminderEmail({
          userName: typedProfile.name,
          planName: "Injection plan",
          scheduledLabel: scheduledDate.toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        });

        // 📤 Send email
        await sendPeptiqEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          fromType: "default",
        });

        // ✅ Mark as sent
        await supabase
          .from("plan_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        sent += 1;
      } catch (err) {
        failed += 1;

        console.error("Reminder send error:", {
          reminderId: reminder.id,
          error: err instanceof Error ? err.message : String(err),
        });

        // ❗ Optionally mark failed
        await supabase
          .from("plan_reminders")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: reminders?.length ?? 0,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Reminder cron fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected failure" },
      { status: 500 }
    );
  }
}