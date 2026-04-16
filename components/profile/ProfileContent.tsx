import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";
import {
  ChangePasswordForm,
  InviteFriendCard,
  UpdateNameForm,
  UpdateNotificationsForm,
} from "@/app/(protected)/profile/ProfileForms";
import type { ActionState } from "@/app/(protected)/profile/ProfileForms";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPasswordChangedEmail } from "@/lib/email/templates/password-changed";

type ProfileRow = {
  name: string | null;
  role: string | null;
  disclaimer_accepted: boolean | null;
  notification_email_reminders: boolean | null;
  notification_missed_alerts: boolean | null;
  plan_tier: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
};

function formatJoinedDate(dateString?: string | null) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBillingDate(dateString?: string | null) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function updateName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { status: "error", message: "Please enter your name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "You need to be logged in to update your profile.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    console.error("Update name error:", error);
    return {
      status: "error",
      message: "Could not save your name. Please try again.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Your name has been updated.",
  };
}

async function updateNotifications(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";

  const emailReminders = formData.get("emailReminders") === "on";
  const missedReminderAlerts = formData.get("missedReminderAlerts") === "on";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "You need to be logged in to update notifications.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_email_reminders: emailReminders,
      notification_missed_alerts: missedReminderAlerts,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Update notifications error:", error);
    return {
      status: "error",
      message: "Could not save notification preferences.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Notification preferences saved.",
  };
}

async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";

  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!password || !confirmPassword) {
    return {
      status: "error",
      message: "Please complete both password fields.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "You need to be logged in to change your password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Change password error:", error);

    const friendlyMessage =
      error.message?.toLowerCase().includes("different from")
        ? "Your new password must be different from your current password."
        : error.message || "Could not update password.";

    return {
      status: "error",
      message: friendlyMessage,
    };
  }

  let emailFailed = false;

  if (user.email) {
    try {
      console.log("Sending password changed email", {
        userId: user.id,
        email: user.email,
        hasApiKey: Boolean(process.env.RESEND_API_KEY),
        fromType: "security",
      });

      const email = getPasswordChangedEmail({
        appName: "PEPT|IQ",
        supportEmail: "support@peptiq.uk",
      });

      await sendPeptiqEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        fromType: "security",
      });

      console.log("Password changed email sent successfully");
    } catch (emailError) {
      emailFailed = true;

      console.error("Password changed email error:", {
        userId: user.id,
        email: user.email,
        error:
          emailError instanceof Error
            ? emailError.message
            : String(emailError),
      });
    }
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: emailFailed
      ? "Your password has been updated, but we could not send the security email."
      : "Your password has been updated.",
  };
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 ${className}`}
    >
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
        {value}
      </div>
    </div>
  );
}

export default async function ProfileContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userId = user.id;

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      `
        name,
        role,
        disclaimer_accepted,
        notification_email_reminders,
        notification_missed_alerts,
        plan_tier,
        subscription_status,
        subscription_current_period_end
      `
    )
    .eq("id", userId)
    .maybeSingle();

  const profile = (profileData ?? null) as ProfileRow | null;

  const notificationPreferences = {
    emailReminders: profile?.notification_email_reminders ?? true,
    missedReminderAlerts: profile?.notification_missed_alerts ?? true,
  };

  const name = profile?.name ?? "";
  const email = user.email ?? "—";
  const joinedDate = formatJoinedDate(user.created_at);

  const planTier = getEffectivePlanTierForUser(user.email, profile ?? undefined);
  const isPro = planTier === "pro";
  const subscriptionStatus = profile?.subscription_status ?? "inactive";
  const subscriptionPeriodEnd = formatBillingDate(
    profile?.subscription_current_period_end
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_0.9fr]">
          <SectionCard
            title="Personal Information"
            description="Your account details and profile settings."
          >
            <div className="grid gap-3">
              <UpdateNameForm defaultName={name} action={updateName} />

              <div className="grid grid-cols-2 gap-3">
                <InfoTile
                  label="Email"
                  value={
                    <span className="block max-w-full truncate" title={email}>
                      {email}
                    </span>
                  }
                />
                <InfoTile label="Date Joined" value={joinedDate} />
                <InfoTile label="Status" value="Active" />
                <InfoTile
                  label="Reminders"
                  value={notificationPreferences.emailReminders ? "On" : "Off"}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Subscription"
            description="Your current plan and upgrade options."
          >
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    Current Plan
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xl font-semibold text-[var(--color-text)]">
                      {isPro ? "Pro" : "Free"}
                    </p>
                    
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {isPro
                  ? "Unlimited plans, full history, and advanced tracking tools."
                  : "Up to 2 active plans, 30-day history, and core tracking tools."}
              </p>

              {isPro ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Status:{" "}
                  <span className="font-medium text-[var(--color-text)]">
                    {subscriptionStatus}
                  </span>
                  {subscriptionPeriodEnd
                    ? ` · Renews through ${subscriptionPeriodEnd}`
                    : ""}
                </p>
              ) : null}

              <div className="mt-4 grid gap-2 text-sm">
                <div className="rounded-xl bg-white px-3 py-2 text-[var(--color-text)]">
                  {isPro ? "Unlimited active plans" : "Up to 2 active plans"}
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-[var(--color-text)]">
                  {isPro ? "Full history access" : "30-day history access"}
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-[var(--color-text)]">
                  {isPro
                    ? "Advanced insights and reminders"
                    : "Basic insights and reminders"}
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href={isPro ? "/manage-subscription" : "/pricing"}
                  className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isPro
                      ? "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                      : "bg-[var(--color-text)] text-white hover:opacity-90"
                  }`}
                >
                  {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                </Link>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Security & Account">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
                Change Password
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Update your password while logged in.
              </p>

              <ChangePasswordForm action={changePassword} />
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
                  Account Tools
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  More account management options will be added here.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-muted)]"
                  >
                    Export Data (Coming Soon)
                  </button>

                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-muted)]"
                  >
                    Sign Out of All Devices (Coming Soon)
                  </button>

                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-muted)]"
                  >
                    Delete Account (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <SectionCard
            title="Notifications"
            description="Manage the emails PEPT|IQ can send you."
          >
            <UpdateNotificationsForm
              defaultEmailReminders={notificationPreferences.emailReminders}
              defaultMissedReminderAlerts={
                notificationPreferences.missedReminderAlerts
              }
              action={updateNotifications}
            />

            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <p className="font-medium text-[var(--color-text)]">
                Security emails
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Password reset and account security alerts are always enabled.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Sharing"
            description="Invite someone else to explore PEPT|IQ."
          >
            <InviteFriendCard shareUrl="https://peptiq.uk/" />
          </SectionCard>
        </div>
      </div>
    </main>
  );
}