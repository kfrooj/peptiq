import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getMissedInjectionAlertEmail } from "@/lib/email/templates/missed-injection-alert";

type ReminderRow = {
  id: string;
  user_id: string;
  plan_id: string;
  reminder_for: string;
  is_completed: boolean;
  status: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  notification_missed_alerts: boolean | null;
};

const MISSED_ALERT_GRACE_HOURS = 2;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const now = new Date();
    const cutoff = new Date(
      now.getTime() - MISSED_ALERT_GRACE_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: reminders, error } = await supabase
  .from("plan_reminders")
  .select("id, user_id, plan_id, reminder_for, is_completed, status")
  .eq("is_completed", false)
  .eq("status", "sent")
  .lte("reminder_for", cutoff)
  .limit(50);

    if (error) {
      console.error("Missed alerts fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch missed reminders" },
        { status: 500 }
      );
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const reminder of (reminders ?? []) as ReminderRow[]) {
      try {
        const { data: existingLog, error: logLookupError } = await supabase
          .from("reminder_email_logs")
          .select("id")
          .eq("plan_id", reminder.plan_id)
          .eq("scheduled_for", reminder.reminder_for)
          .eq("kind", "missed_alert")
          .maybeSingle();

        if (logLookupError) {
          console.error("Missed alert log lookup error:", logLookupError);
        }

        if (existingLog) {
          skipped += 1;
          continue;
        }

        const [{ data: profile }, { data: authUserResult, error: authUserError }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, name, notification_missed_alerts")
              .eq("id", reminder.user_id)
              .maybeSingle(),
            supabase.auth.admin.getUserById(reminder.user_id),
          ]);

        if (authUserError) {
          console.error("Missed alert auth lookup error:", {
            userId: reminder.user_id,
            error: authUserError,
          });
          failed += 1;
          continue;
        }

        const typedProfile = profile as ProfileRow | null;
        const email = authUserResult.user?.email ?? null;

        if (!typedProfile?.notification_missed_alerts || !email) {
          skipped += 1;
          continue;
        }

        const reminderForDate = new Date(reminder.reminder_for);

        const emailContent = getMissedInjectionAlertEmail({
          userName: typedProfile.name,
          scheduledLabel: reminderForDate.toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        });

        await sendPeptiqEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          fromType: "default",
        });

        const { error: insertLogError } = await supabase
          .from("reminder_email_logs")
          .insert({
            user_id: reminder.user_id,
            plan_id: reminder.plan_id,
            scheduled_for: reminder.reminder_for,
            kind: "missed_alert",
          });

        if (insertLogError) {
          console.error("Missed alert log insert error:", insertLogError);
        }

        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("Missed alert send error:", {
          reminderId: reminder.id,
          userId: reminder.user_id,
          error: error instanceof Error ? error.message : String(error),
        });
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
    console.error("Missed alerts cron fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected missed alert failure" },
      { status: 500 }
    );
  }
}