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
  status: string;
  missed_alert_sent_at: string | null;
  completed_at: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  notification_missed_alerts: boolean | null;
  timezone: string | null;
};

const MISSED_ALERT_GRACE_HOURS = 2;

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peptiq.uk";

    const now = new Date();
    const cutoff = new Date(
      now.getTime() - MISSED_ALERT_GRACE_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: scheduledInjections, error } = await supabase
      .from("scheduled_injections")
      .select(`
        id,
        user_id,
        plan_id,
        scheduled_for,
        timezone,
        status,
        missed_alert_sent_at,
        completed_at
      `)
      .eq("status", "pending")
      .is("completed_at", null)
      .is("missed_alert_sent_at", null)
      .lte("scheduled_for", cutoff)
      .limit(50);

    if (error) {
      console.error("Missed alerts fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch missed scheduled injections" },
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
              .select("id, name, notification_missed_alerts, timezone")
              .eq("id", injection.user_id)
              .maybeSingle(),
            supabase.auth.admin.getUserById(injection.user_id),
          ]);

        if (authUserError) {
          console.error("Missed alert auth lookup error:", {
            injectionId: injection.id,
            userId: injection.user_id,
            error: authUserError,
          });

          failed += 1;
          continue;
        }

        const typedProfile = profile as ProfileRow | null;
        const email = authUserResult.user?.email ?? null;

        if (!typedProfile?.notification_missed_alerts || !email) {
          skipped += 1;

          console.log("Skipping missed alert email", {
            injectionId: injection.id,
            userId: injection.user_id,
            hasEmail: Boolean(email),
            missedAlertsEnabled:
              typedProfile?.notification_missed_alerts ?? false,
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

        const emailContent = getMissedInjectionAlertEmail({
          userName: typedProfile.name,
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
            { name: "category", value: "missed-injection-alert" },
            { name: "scheduled_injection_id", value: injection.id },
            { name: "plan_id", value: injection.plan_id },
          ],
        });

        await supabase
          .from("scheduled_injections")
          .update({
            missed_alert_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", injection.id);

        sent += 1;
      } catch (error) {
        failed += 1;

        console.error("Missed alert send error:", {
          injectionId: injection.id,
          userId: injection.user_id,
          error: error instanceof Error ? error.message : String(error),
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
    console.error("Missed alerts cron fatal error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected missed alert failure" },
      { status: 500 }
    );
  }
}