import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ChangePasswordForm,
  InviteFriendCard,
  UpdateNameForm,
  UpdateNotificationsForm,
} from "./ProfileForms";
import type { ActionState } from "./ProfileForms";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPasswordChangedEmail } from "@/lib/email/templates/password-changed";

type InjectionPlanRow = {
  id: string;
  user_id: string;
  peptide_id: string | null;
  plan_name: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency_type: string | null;
  frequency_value: number | null;
  start_date: string | null;
  end_date: string | null;
  default_time: string | null;
  active: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  reminders_enabled: boolean | null;
  reminder_offset_hours: number | null;
};

type InjectionLogRow = {
  id: string;
  user_id: string;
  peptide_id: string | null;
  plan_id: string | null;
  injection_at: string;
  dose_amount: number | null;
  dose_unit: string | null;
  site: string | null;
  notes: string | null;
  created_at: string | null;
};

type FavoritePeptideIdRow = {
  peptide_id: string;
};

type FavoriteStackIdRow = {
  stack_id: string;
};

type PeptideRow = {
  id: string;
  name: string;
  category: string | null;
};

type StackRow = {
  id: string;
  name: string;
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

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetweenInclusive(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(diff / msPerDay) + 1;
}

function getExpectedOccurrencesForPlan(
  plan: InjectionPlanRow,
  today = new Date()
): number {
  if (!plan.start_date) return 0;

  const start = startOfDay(new Date(plan.start_date));
  const now = startOfDay(today);

  if (Number.isNaN(start.getTime())) return 0;
  if (start > now) return 0;

  const rawEnd = plan.end_date ? new Date(plan.end_date) : null;
  const end =
    rawEnd && !Number.isNaN(rawEnd.getTime())
      ? startOfDay(rawEnd) < now
        ? startOfDay(rawEnd)
        : now
      : now;

  if (end < start) return 0;

  const frequencyType = (plan.frequency_type ?? "daily").toLowerCase();
  const frequencyValue =
    typeof plan.frequency_value === "number" && plan.frequency_value > 0
      ? plan.frequency_value
      : 1;

  if (frequencyType === "daily") {
    const totalDays = daysBetweenInclusive(start, end);
    return Math.floor((totalDays - 1) / frequencyValue) + 1;
  }

  if (frequencyType === "weekly") {
    const totalDays = daysBetweenInclusive(start, end);
    const intervalDays = frequencyValue * 7;
    return Math.floor((totalDays - 1) / intervalDays) + 1;
  }

  const totalDays = daysBetweenInclusive(start, end);
  return Math.floor((totalDays - 1) / frequencyValue) + 1;
}

async function getAdherenceForUser(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const [plansResult, logsResult] = await Promise.all([
    supabase
      .from("injection_plans")
      .select(
        `
          id,
          user_id,
          peptide_id,
          plan_name,
          dose_amount,
          dose_unit,
          frequency_type,
          frequency_value,
          start_date,
          end_date,
          default_time,
          active,
          notes,
          created_at,
          updated_at,
          reminders_enabled,
          reminder_offset_hours
        `
      )
      .eq("user_id", userId)
      .eq("active", true),

    supabase
      .from("injection_logs")
      .select(
        `
          id,
          user_id,
          peptide_id,
          plan_id,
          injection_at,
          dose_amount,
          dose_unit,
          site,
          notes,
          created_at
        `
      )
      .eq("user_id", userId)
      .not("plan_id", "is", null),
  ]);

  const plans = (plansResult.data ?? []) as InjectionPlanRow[];
  const logs = (logsResult.data ?? []) as InjectionLogRow[];

  const today = new Date();

  const expectedCount = plans.reduce((total, plan) => {
    return total + getExpectedOccurrencesForPlan(plan, today);
  }, 0);

  const completedCount = logs.filter((log) => {
    const injectionDate = new Date(log.injection_at);
    return !Number.isNaN(injectionDate.getTime()) && injectionDate <= today;
  }).length;

  if (expectedCount <= 0) {
    return {
      percentage: "—",
      completedCount: 0,
      expectedCount: 0,
    };
  }

  const adherencePercent = Math.min(
    100,
    Math.round((completedCount / expectedCount) * 100)
  );

  return {
    percentage: `${adherencePercent}%`,
    completedCount,
    expectedCount,
  };
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

 async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  "use server";

  const password = String(formData.get("password") ?? "").trim();

  if (!password) {
    return {
      status: "error",
      message: "Please enter a new password.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
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

  // ✅ TypeScript now knows user is NOT null
  const { error } = await supabase.auth.updateUser({
    password,
  });

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

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Your password has been updated.",
  };
}

  if (user.email) {
    try {
      const email = getPasswordChangedEmail({
        appName: "PEPTIQ",
        supportEmail: "support@peptiq.uk",
      });

      await sendPeptiqEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    } catch (emailError) {
      console.error("Password changed email error:", emailError);
    }
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Your password has been updated.",
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
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <div className="mt-2 text-sm font-medium text-[var(--color-text)]">
        {value}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = false,
  subtext,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <div className="mt-2">
        {accent ? (
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[var(--color-accent)]">
            {value}
          </span>
        ) : (
          <span className="text-3xl font-semibold leading-none text-[var(--color-text)]">
            {value}
          </span>
        )}
      </div>
      {subtext ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">{subtext}</p>
      ) : null}
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userId = user.id;

  const [
    profileResult,
    plansCountResult,
    injectionLogsCountResult,
    favoritePeptidesCountResult,
    favoriteStacksCountResult,
    favoritePeptideIdsResult,
    favoriteStackIdsResult,
    adherence,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
          name,
          role,
          disclaimer_accepted,
          notification_email_reminders,
          notification_missed_alerts
        `
      )
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("injection_plans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("injection_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("favorite_peptides")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("favorite_stacks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("favorite_peptides")
      .select("peptide_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("favorite_stacks")
      .select("stack_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),

    getAdherenceForUser(userId, supabase),
  ]);

  const profile = profileResult.data;

  const plansCount = plansCountResult.count ?? 0;
  const injectionLogsCount = injectionLogsCountResult.count ?? 0;
  const favoritePeptidesCount = favoritePeptidesCountResult.count ?? 0;
  const favoriteStacksCount = favoriteStacksCountResult.count ?? 0;
  const totalFavoritesCount = favoritePeptidesCount + favoriteStacksCount;

  const favoritePeptideIds = (
    (favoritePeptideIdsResult.data ?? []) as FavoritePeptideIdRow[]
  )
    .map((item) => item.peptide_id)
    .filter(Boolean);

  const favoriteStackIds = (
    (favoriteStackIdsResult.data ?? []) as FavoriteStackIdRow[]
  )
    .map((item) => item.stack_id)
    .filter(Boolean);

  const [peptidesResult, stacksResult] = await Promise.all([
    favoritePeptideIds.length > 0
      ? supabase
          .from("peptides")
          .select("id, name, category")
          .in("id", favoritePeptideIds)
      : Promise.resolve({ data: [] as PeptideRow[], error: null }),

    favoriteStackIds.length > 0
      ? supabase.from("stacks").select("id, name").in("id", favoriteStackIds)
      : Promise.resolve({ data: [] as StackRow[], error: null }),
  ]);

  const peptidesById = new Map(
    ((peptidesResult.data ?? []) as PeptideRow[]).map((item) => [item.id, item])
  );

  const stacksById = new Map(
    ((stacksResult.data ?? []) as StackRow[]).map((item) => [item.id, item])
  );

  const favoritePeptides = favoritePeptideIds
    .map((id) => peptidesById.get(id))
    .filter((item): item is PeptideRow => Boolean(item));

  const favoriteStacks = favoriteStackIds
    .map((id) => stacksById.get(id))
    .filter((item): item is StackRow => Boolean(item));

  const notificationPreferences = {
    emailReminders: profile?.notification_email_reminders ?? true,
    missedReminderAlerts: profile?.notification_missed_alerts ?? true,
  };

  const name = profile?.name ?? "";
  const email = user.email ?? "—";
  const joinedDate = formatJoinedDate(user.created_at);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <SectionCard
            title="Personal Information"
            description="Your account details and basic profile information."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UpdateNameForm defaultName={name} action={updateName} />
              <InfoTile label="Email" value={email} />
              <InfoTile label="Date Joined" value={joinedDate} />
              <InfoTile label="Account Type" value="Free" />
            </div>
          </SectionCard>

          <SectionCard title="Subscription">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-[var(--color-muted)]">Current Plan</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">
                  Free
                </p>
              </div>

              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--color-muted)]"
              >
                Manage Subscription (Coming Soon)
              </button>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Activity Stats">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Plans" value={plansCount} />
            <StatTile label="Injections Logged" value={injectionLogsCount} />
            <StatTile
              label="Adherence"
              value={adherence.percentage}
              accent
              subtext={
                adherence.expectedCount > 0
                  ? `${adherence.completedCount} of ${adherence.expectedCount} due injections completed`
                  : "No due injections yet"
              }
            />
            <StatTile label="Favorites" value={totalFavoritesCount} />
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <SectionCard
            title="Favorites"
            description="Your saved peptides and stacks for quick access."
          >
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--color-muted)]">
                {totalFavoritesCount} total saved favorites
              </div>

              <Link
                href="/peptides"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
              >
                Browse Peptides
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    Favorite Peptides
                  </h3>
                  <span className="text-sm text-[var(--color-muted)]">
                    {favoritePeptidesCount}
                  </span>
                </div>

                {favoritePeptides.length > 0 ? (
                  <div className="space-y-3">
                    {favoritePeptides.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                      >
                        <Link
                          href={`/peptides/${item.id}`}
                          className="block rounded-lg outline-none transition hover:opacity-80 focus:ring-2 focus:ring-[var(--color-accent)]"
                        >
                          <p className="font-medium text-[var(--color-text)]">
                            {item.name}
                          </p>
                          {item.category ? (
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {item.category}
                            </p>
                          ) : null}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-sm text-[var(--color-muted)]">
                    No favorite peptides yet.
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    Favorite Stacks
                  </h3>
                  <span className="text-sm text-[var(--color-muted)]">
                    {favoriteStacksCount}
                  </span>
                </div>

                {favoriteStacks.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteStacks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                      >
                        <Link
                          href={`/stacks/${item.id}`}
                          className="block rounded-lg outline-none transition hover:opacity-80 focus:ring-2 focus:ring-[var(--color-accent)]"
                        >
                          <p className="font-medium text-[var(--color-text)]">
                            {item.name}
                          </p>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-sm text-[var(--color-muted)]">
                    No favorite stacks yet.
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notifications"
            description="Manage the emails PEPTIQ can send you. Push notifications can be added later in the mobile app."
          >
            <div className="space-y-6">
              <UpdateNotificationsForm
                defaultEmailReminders={notificationPreferences.emailReminders}
                defaultMissedReminderAlerts={
                  notificationPreferences.missedReminderAlerts
                }
                action={updateNotifications}
              />

              <div className="grid grid-cols-1 gap-4">
                <InviteFriendCard shareUrl="https://peptiq.vercel.app/" />

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <p className="font-medium text-[var(--color-text)]">
                    Security emails
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Password reset and account security alerts are always enabled
                    to help keep your account secure.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

    <SectionCard title="Security & Account">
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">
        Change Password
      </h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Update your password while logged in. For security, PEPTIQ will alert
        you when your password has been changed.
      </p>

      <ChangePasswordForm action={changePassword} />
    </div>

    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Security Emails
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Password reset and account security alerts are always enabled to help
          keep your account secure.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Account Tools
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Future account management options will live here as PEPTIQ grows.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-muted)]"
          >
            Export Data (Coming Soon)
          </button>

          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-muted)]"
          >
            Sign Out of All Devices (Coming Soon)
          </button>

          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-muted)]"
          >
            Delete Account (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  </div>
</SectionCard>
      </div>
    </main>
  );
}