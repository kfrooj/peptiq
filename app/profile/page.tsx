import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ReminderRow = {
  id: string;
  is_completed: boolean;
  reminder_for: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  created_at: string | null;
  email_reminders: boolean;
  missed_reminder_alerts: boolean;
};

type FavoritePeptideRelation = {
  id: string;
  name: string;
  category: string | null;
};

type FavoriteRow = {
  id: string;
  peptide: FavoritePeptideRelation | FavoritePeptideRelation[] | null;
};

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getOverallAdherence(reminders: ReminderRow[]) {
  if (!reminders.length) return null;

  const now = new Date();

  const dueReminders = reminders.filter(
    (reminder) => new Date(reminder.reminder_for) <= now
  );

  if (!dueReminders.length) return null;

  const completedCount = dueReminders.filter(
    (reminder) => reminder.is_completed
  ).length;

  return Math.round((completedCount / dueReminders.length) * 100);
}

function getAdherenceBadgeStyles(adherence: number | null) {
  if (adherence === null) {
    return {
      bg: "bg-gray-100",
      text: "text-gray-600",
    };
  }

  if (adherence >= 80) {
    return {
      bg: "bg-green-50",
      text: "text-green-700",
    };
  }

  if (adherence >= 50) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
    };
  }

  return {
    bg: "bg-red-50",
    text: "text-red-700",
  };
}

function formatJoinedDate(value: string | null | undefined) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getBannerMessage(success?: string, error?: string) {
  if (error) {
    const decoded = decodeURIComponent(error);

    if (decoded === "password-too-short") {
      return {
        type: "error" as const,
        text: "Password must be at least 8 characters.",
      };
    }

    return {
      type: "error" as const,
      text: decoded,
    };
  }

  if (success) {
    const decoded = decodeURIComponent(success);

    if (decoded === "password-updated") {
      return {
        type: "success" as const,
        text: "Password updated successfully.",
      };
    }

    if (decoded === "name-updated") {
      return {
        type: "success" as const,
        text: "Profile name updated successfully.",
      };
    }

    if (decoded === "notifications-updated") {
      return {
        type: "success" as const,
        text: "Notification preferences updated successfully.",
      };
    }

    return {
      type: "success" as const,
      text: decoded,
    };
  }

  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const banner = getBannerMessage(params?.success, params?.error);

  const [
    { data: profile, error: profileError },
    { data: plans, error: plansError },
    { data: logs, error: logsError },
    { data: favorites, error: favoritesError },
    { data: reminders, error: remindersError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, created_at, email_reminders, missed_reminder_alerts")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("injection_plans").select("id").eq("user_id", user.id),
    supabase.from("injection_logs").select("id").eq("user_id", user.id),
    supabase
      .from("favorite_peptides")
      .select(
        `
          id,
          peptide:peptides (
            id,
            name,
            category
          )
        `
      )
      .eq("user_id", user.id),
    supabase
      .from("plan_reminders")
      .select("id, is_completed, reminder_for")
      .eq("user_id", user.id),
  ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (plansError) {
    throw new Error(plansError.message);
  }

  if (logsError) {
    throw new Error(logsError.message);
  }

  if (favoritesError) {
    throw new Error(favoritesError.message);
  }

  if (remindersError) {
    throw new Error(remindersError.message);
  }

  const profileData = profile as ProfileRow | null;

  const normalizedFavorites = ((favorites ?? []) as FavoriteRow[])
    .map((favorite) => ({
      id: favorite.id,
      peptide: normalizeSingleRelation<FavoritePeptideRelation>(favorite.peptide),
    }))
    .filter((favorite) => favorite.peptide !== null);

  const planCount = plans?.length ?? 0;
  const injectionCount = logs?.length ?? 0;
  const favoriteCount = normalizedFavorites.length;
  const overallAdherence = getOverallAdherence(
    (reminders ?? []) as ReminderRow[]
  );
  const adherenceStyles = getAdherenceBadgeStyles(overallAdherence);

  const displayName =
    profileData?.name?.trim() ||
    user.email?.split("@")[0] ||
    "PEPTIQ User";

  const joinedDate = formatJoinedDate(profileData?.created_at);

  const emailReminders = profileData?.email_reminders ?? true;
  const missedReminderAlerts = profileData?.missed_reminder_alerts ?? true;

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Manage your account, preferences, and activity.
        </p>
      </div>

      {banner ? (
        <div
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm shadow-sm sm:mb-6 ${
            banner.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:col-span-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              Account Overview
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Your account details and basic profile information.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <form
              action="/profile/update-name"
              method="post"
              className="rounded-xl border border-[var(--color-border)] p-4"
            >
              <p className="text-xs text-[var(--color-muted)]">Name</p>

              <input
                name="name"
                defaultValue={profileData?.name ?? ""}
                placeholder="Enter your name"
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white transition hover:bg-blue-500 sm:w-auto"
              >
                Save
              </button>
            </form>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Display Name</p>
              <p className="mt-1 text-sm font-medium capitalize text-[var(--color-text)]">
                {displayName}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Email</p>
              <p className="mt-1 break-all text-sm font-medium text-[var(--color-text)]">
                {user.email ?? "No email available"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Joined</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                {joinedDate}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4 sm:col-span-2">
              <p className="text-xs text-[var(--color-muted)]">Account Type</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                Free
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Subscription
          </h2>

          <div className="mt-4">
            <p className="text-sm text-[var(--color-muted)]">Current Plan</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
              Free
            </p>

            <button
              disabled
              className="mt-4 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]"
            >
              Manage Subscription (Coming Soon)
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Activity Stats
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Plans</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                {planCount}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">
                Injections Logged
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                {injectionCount}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Adherence</p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${adherenceStyles.bg} ${adherenceStyles.text}`}
                >
                  {overallAdherence !== null ? `${overallAdherence}%` : "No data"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">Favorites</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                {favoriteCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                Favorites
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Your saved peptides and quick references.
              </p>
            </div>

            <Link
              href="/peptides"
              className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Browse Peptides
            </Link>
          </div>

          <div className="mt-4">
            {normalizedFavorites.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                No favorite peptides yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {normalizedFavorites.slice(0, 6).map((favorite) => (
                  <div
                    key={favorite.id}
                    className="rounded-xl border border-[var(--color-border)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {favorite.peptide?.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {favorite.peptide?.category || "Uncategorized"}
                    </p>
                  </div>
                ))}

                {normalizedFavorites.length > 6 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    And {normalizedFavorites.length - 6} more saved peptide
                    {normalizedFavorites.length - 6 === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <form
          action="/profile/update-notifications"
          method="post"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Notifications
          </h2>

          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Choose which reminder-related emails you want to receive.
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Email reminders
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Receive reminder emails for scheduled plan activity.
                </p>
              </div>

              <input
                type="checkbox"
                name="email_reminders"
                defaultChecked={emailReminders}
                className="h-4 w-4"
              />
            </label>

            <label className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Missed reminder alerts
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Get alerted when a scheduled reminder is missed.
                </p>
              </div>

              <input
                type="checkbox"
                name="missed_reminder_alerts"
                defaultChecked={missedReminderAlerts}
                className="h-4 w-4"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm text-white transition hover:bg-blue-500 sm:w-auto"
          >
            Save Preferences
          </button>
        </form>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Security & Account
          </h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <form
              action="/profile/change-password"
              method="post"
              className="rounded-xl border border-[var(--color-border)] p-4"
            >
              <p className="text-sm font-medium text-[var(--color-text)]">
                Change Password
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Update your password while logged in.
              </p>

              <input
                type="password"
                name="password"
                minLength={8}
                required
                placeholder="New password"
                className="mt-3 w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 sm:w-auto"
              >
                Change Password
              </button>
            </form>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Account Tools
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                More account options will be added here as PEPTIQ grows.
              </p>

              <button
                disabled
                className="mt-3 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)] sm:w-auto"
              >
                Export Data (Coming Soon)
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}