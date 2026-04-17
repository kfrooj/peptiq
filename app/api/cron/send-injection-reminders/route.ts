import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInjectionReminderEmail } from "@/lib/email/templates/injection-reminder";
import { getMissedInjectionAlertEmail } from "@/lib/email/templates/missed-injection-alert";
import { sendPeptiqEmail } from "@/lib/email/resend";

type ScheduledInjectionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  scheduled_for: string;
  timezone: string | null;
  plan_name: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  status: string;
  reminder_sent_at: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  notification_email_reminders: boolean | null;
  timezone: string | null;
};

function formatScheduledLabel(
  scheduledFor: string,
  timezone?: string | null
) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || "UTC",
  }).format(new Date(scheduledFor));
}

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
    const nowIso = new Date().toISOString();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peptiq.uk";

    const { data: scheduledInjections, error } = await supabase
      .from("scheduled_injections")
      .select(`
        id,
        user_id,
        plan_id,
        scheduled_for,
        timezone,
        plan_name,
        dose_amount,
        dose_unit,
        status,
        reminder_sent_at
      `)
      .eq("status", "pending")
      .is("reminder_sent_at", null)
      .lte("scheduled_for", nowIso)
      .limit(50);

    if (error) {
      console.error("Scheduled injections fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch scheduled injections" },
        { status: 500 }
      );
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const injection of (scheduledInjections ?? []) as ScheduledInjectionRow[]) {
      try {
        const [{ data: profile }, { data: authUserResult, error: authUserError }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id, name, notification_email_reminders, timezone")
              .eq("id", injection.user_id)
              .maybeSingle(),
            supabase.auth.admin.getUserById(injection.user_id),
          ]);

        if (authUserError) {
          console.error("Reminder auth lookup error:", {
            injectionId: injection.id,
            userId: injection.user_id,
            error: authUserError,
          });

          failed += 1;
          continue;
        }

        const typedProfile = profile as ProfileRow | null;
        const email = authUserResult.user?.email ?? null;

        if (!typedProfile?.notification_email_reminders || !email) {
          skipped += 1;

          console.log("Skipping injection reminder email", {
            injectionId: injection.id,
            userId: injection.user_id,
            hasEmail: Boolean(email),
            emailRemindersEnabled:
              typedProfile?.notification_email_reminders ?? false,
          });

          await supabase
            .from("scheduled_injections")
            .update({
              status: "skipped",
              updated_at: new Date().toISOString(),
            })
            .eq("id", injection.id);

          continue;
        }

        const effectiveTimezone =
          typedProfile?.timezone || injection.timezone || "UTC";

        const scheduledLabel = formatScheduledLabel(
          injection.scheduled_for,
          effectiveTimezone
        );

        const appUrl = `${siteUrl}/plans/${injection.plan_id}`;

        const emailContent = getInjectionReminderEmail({
          userName: typedProfile.name,
          planName: injection.plan_name ?? "Injection plan",
          doseAmount: injection.dose_amount,
          doseUnit: injection.dose_unit,
          scheduledLabel,
          appUrl,
        });

        await sendPeptiqEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          fromType: "default",
          tags: [
            { name: "category", value: "injection-reminder" },
            { name: "scheduled_injection_id", value: injection.id },
            { name: "plan_id", value: injection.plan_id },
          ],
        });

        await supabase
          .from("scheduled_injections")
          .update({
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", injection.id);

        sent += 1;
      } catch (err) {
        failed += 1;

        console.error("Injection reminder send error:", {
          injectionId: injection.id,
          userId: injection.user_id,
          error: err instanceof Error ? err.message : String(err),
        });

        await supabase
          .from("scheduled_injections")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", injection.id);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: scheduledInjections?.length ?? 0,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Injection reminder cron fatal error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected failure" },
      { status: 500 }
    );
  }
}