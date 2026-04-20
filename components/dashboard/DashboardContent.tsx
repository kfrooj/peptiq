import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ReminderRow = {
  id: string;
  plan_id: string | null;
  reminder_for: string;
  scheduled_for: string | null;
  is_completed: boolean;
  status: string | null;
  plan: {
    id: string;
    plan_name: string;
  } | null;
};

type InjectionLogRow = {
  id: string;
  injection_at: string;
  dose_amount: number | null;
  dose_unit: string | null;
  site: string | null;
  peptide: {
    id: string;
    name: string;
  } | null;
};

type PlanRow = {
  id: string;
  plan_name: string;
  active: boolean;
};

type ProfileRow = {
  id: string;
  name: string | null;
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
  slug: string;
  category: string | null;
};

type StackRow = {
  id: string;
  name: string;
};

function formatLocalDate(value: string | Date) {
  return new Date(value).toLocaleDateString();
}

function formatLocalDateTime(value: string | Date) {
  return new Date(value).toLocaleString();
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

function buildLogInjectionHref(
  planId?: string | null,
  injectionAt?: string | null
) {
  const params = new URLSearchParams();

  if (planId) {
    params.set("planId", planId);
  }

  if (injectionAt) {
    params.set("injectionAt", injectionAt);
  }

  const query = params.toString();
  return query ? `/log-injection?${query}` : "/log-injection";
}

export default async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("DashboardContent requires an authenticated user.");
  }

  const now = new Date();

  const [
    { data: profile, error: profileError },
    { data: logs, error: logsError },
    { data: plans, error: plansError },
    { data: reminders, error: remindersError },
    favoritePeptideIdsResult,
    favoriteStackIdsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("injection_logs")
      .select(
        `
          id,
          injection_at,
          dose_amount,
          dose_unit,
          site,
          peptide:peptides (
            id,
            name
          )
        `
      )
      .eq("user_id", user.id)
      .order("injection_at", { ascending: false })
      .limit(5),
    supabase
      .from("injection_plans")
      .select("id, plan_name, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("plan_reminders")
      .select(
        `
          id,
          plan_id,
          reminder_for,
          scheduled_for,
          is_completed,
          status,
          plan:injection_plans (
            id,
            plan_name
          )
        `
      )
      .eq("user_id", user.id),
    supabase
      .from("favorite_peptides")
      .select("peptide_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("favorite_stacks")
      .select("stack_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (logsError) throw new Error(logsError.message);
  if (plansError) throw new Error(plansError.message);
  if (remindersError) throw new Error(remindersError.message);

  const profileData = profile as ProfileRow | null;

  const displayName =
    profileData?.name?.trim() || user.email?.split("@")[0] || "there";

  const typedLogs: InjectionLogRow[] = (logs ?? []).map((row: any) => ({
    id: row.id,
    injection_at: row.injection_at,
    dose_amount: row.dose_amount ?? null,
    dose_unit: row.dose_unit ?? null,
    site: row.site ?? null,
    peptide: Array.isArray(row.peptide)
      ? row.peptide[0] ?? null
      : row.peptide ?? null,
  }));

  const typedPlans: PlanRow[] = plans ?? [];
  const typedReminders: ReminderRow[] = (reminders ?? []).map((row: any) => ({
    id: row.id,
    plan_id: row.plan_id ?? null,
    reminder_for: row.reminder_for,
    scheduled_for: row.scheduled_for ?? null,
    is_completed: Boolean(row.is_completed),
    status: row.status ?? null,
    plan: Array.isArray(row.plan) ? row.plan[0] ?? null : row.plan ?? null,
  }));

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
          .select("id, name, slug, category")
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

  const isFirstTimeState = !typedPlans.length && !typedLogs.length;

  const lastInjection = typedLogs[0] ? new Date(typedLogs[0].injection_at) : null;
  const daysSinceLast =
    lastInjection !== null ? daysBetween(lastInjection, now) : null;

  const unresolvedMissedReminders = typedReminders.filter((reminder) => {
    const reminderFor = new Date(reminder.reminder_for);

    return (
      !reminder.is_completed &&
      reminderFor < now &&
      (reminder.status === "pending" || reminder.status === "sent")
    );
  });

  const nextUnresolvedReminder =
    typedReminders
      .filter((reminder) => {
        const reminderFor = new Date(reminder.reminder_for);

        return (
          !reminder.is_completed &&
          reminderFor >= now &&
          (reminder.status === "pending" || reminder.status === "sent")
        );
      })
      .sort(
        (a, b) =>
          new Date(a.reminder_for).getTime() - new Date(b.reminder_for).getTime()
      )[0] ?? null;

  const totalReminders = typedReminders.length;
  const completedReminders = typedReminders.filter(
    (reminder) => reminder.is_completed
  ).length;

  const adherence =
    totalReminders > 0
      ? Math.round((completedReminders / totalReminders) * 100)
      : 0;

  const adherenceTone =
    adherence >= 80 ? "green" : adherence >= 50 ? "amber" : "red";

  const alerts: { title: string; body: string; href: string }[] = [];

  if (unresolvedMissedReminders.length > 0) {
    alerts.push({
      title: "Missed reminders",
      body: `You currently have ${unresolvedMissedReminders.length} unresolved planned injection reminder${
        unresolvedMissedReminders.length === 1 ? "" : "s"
      }.`,
      href: "/log-injection",
    });
  }

  if (daysSinceLast !== null && daysSinceLast >= 3) {
    alerts.push({
      title: "Logging gap",
      body: `No injections logged in ${daysSinceLast} days.`,
      href: "/log-injection",
    });
  }

  if (!typedPlans.length) {
    alerts.push({
      title: "No active plans",
      body: "Set up an injection plan so reminders and adherence tracking can work.",
      href: "/plans",
    });
  }

  if (!typedLogs.length) {
    alerts.push({
      title: "No injection history",
      body: "Log your first injection to start building wellness and adherence data.",
      href: "/log-injection",
    });
  }

  const nextReminderHref = buildLogInjectionHref(
    nextUnresolvedReminder?.plan_id,
    nextUnresolvedReminder?.reminder_for
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      <section className="mb-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mb-8 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-[var(--color-text)] sm:text-3xl">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Your latest activity, reminders, and next steps in one place.
            </p>
          </div>

          <div
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              adherenceTone === "green"
                ? "bg-green-50 text-green-700"
                : adherenceTone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            60-day adherence {adherence}%
          </div>
        </div>
      </section>

      {isFirstTimeState ? (
        <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-blue-900 sm:text-xl">
              Let’s get your tracking set up
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              You’re just getting started. Create your first plan, then log your
              first injection to unlock reminders, adherence tracking, and
              wellness insights.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/plans"
                className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
              >
                Create First Plan
              </Link>

              <Link
                href="/peptides"
                className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-medium text-blue-900 transition hover:bg-blue-100"
              >
                Browse Peptides
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Today’s Next Step
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            The next action that will keep your tracking up to date.
          </p>

          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            {nextUnresolvedReminder ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  Next action
                </p>
                <div className="mt-2">
                  <p className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                    {nextUnresolvedReminder.plan?.plan_name || "Planned injection"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Scheduled for{" "}
                    {formatLocalDateTime(nextUnresolvedReminder.reminder_for)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                  <Link
                    href={nextReminderHref}
                    className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Log Injection
                  </Link>

                  <Link
                    href="/plans"
                    className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    View Plans
                  </Link>

                  <Link
                    href="/wellness"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    View Wellness
                  </Link>
                </div>
              </>
            ) : typedPlans.length > 0 ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  Next action
                </p>
                <div className="mt-2">
                  <p className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                    Nothing due right now
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    You do not have any upcoming unresolved reminders at the
                    moment, but you can still log an injection or review your
                    progress.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                  <Link
                    href="/log-injection"
                    className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Log Injection
                  </Link>

                  <Link
                    href="/plans"
                    className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    View Plans
                  </Link>

                  <Link
                    href="/wellness"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    View Wellness
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  Next action
                </p>
                <div className="mt-2">
                  <p className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                    Start by creating your first plan
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Plans power reminders, adherence tracking, and the rest of
                    your dashboard experience.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                  <Link
                    href="/plans"
                    className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Create Plan
                  </Link>

                  <Link
                    href="/peptides"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    Browse Peptides
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Alerts
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Things that may need your attention.
          </p>

          <div className="mt-4 grid gap-3">
            {!alerts.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
                Everything looks on track.
              </div>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={alert.title}
                  href={alert.href}
                  className="rounded-2xl border border-amber-300 bg-amber-50 p-4 transition hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-amber-900">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {alert.body}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Plans"
          value={String(typedPlans.length)}
          subtitle="Currently running"
        />

        <StatCard
          title="Missed Reminders"
          value={String(unresolvedMissedReminders.length)}
          subtitle="Need attention"
          href={unresolvedMissedReminders.length > 0 ? "/log-injection" : undefined}
        />

        <StatCard
          title="Last Injection"
          value={lastInjection ? formatLocalDate(lastInjection) : "—"}
          subtitle={
            daysSinceLast !== null
              ? `${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago`
              : "No logged injections yet"
          }
        />

        <StatCard
          title="Next Reminder"
          value={
            nextUnresolvedReminder
              ? formatLocalDate(nextUnresolvedReminder.reminder_for)
              : "—"
          }
          subtitle={
            nextUnresolvedReminder
              ? `${
                  nextUnresolvedReminder.plan?.plan_name || "Planned injection"
                }`
              : "No upcoming unresolved reminders"
          }
          href={nextUnresolvedReminder ? nextReminderHref : undefined}
        />
      </section>

      <section className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Jump straight into the most common tasks.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ActionCard
              title="Log Injection"
              description="Record a new injection and keep reminders in sync."
              href="/log-injection"
            />
            <ActionCard
              title="Manage Plans"
              description="Create, update, and organize active protocols."
              href="/plans"
            />
            <ActionCard
              title="View Wellness"
              description="Review trends, missed reminders, and adherence."
              href="/wellness"
            />
            <ActionCard
              title="Browse Peptides"
              description="Open the peptide library and review details."
              href="/peptides"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your latest logged injections.
          </p>

          <div className="mt-4 grid gap-2.5">
            {!typedLogs.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                No recent injections logged yet. Once you log activity, it will
                appear here so you can quickly review your latest entries.
              </div>
            ) : (
              typedLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {log.peptide?.name || "Injection logged"}
                    </p>

                    <p className="text-xs leading-5 text-[var(--color-muted)]">
                      {[
                        log.dose_amount !== null && log.dose_unit
                          ? `${log.dose_amount} ${log.dose_unit}`
                          : null,
                        log.site ? `Site: ${log.site}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Details recorded"}
                    </p>

                    <p className="text-xs text-[var(--color-muted)]">
                      {formatLocalDateTime(log.injection_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              Favorites
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Quick access to your saved peptides and stacks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                Favorite Peptides
              </h3>
              <span className="text-sm text-[var(--color-muted)]">
                {favoritePeptides.length}
              </span>
            </div>

            {favoritePeptides.length > 0 ? (
              <div className="space-y-2">
                {favoritePeptides.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5"
                  >
                    <Link
                      href={`/peptides/${item.slug}`}
                      className="block rounded-lg outline-none transition hover:opacity-80 focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {item.name}
                      </p>
                      {item.category ? (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          {item.category}
                        </p>
                      ) : null}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-5 text-sm text-[var(--color-muted)]">
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
                {favoriteStacks.length}
              </span>
            </div>

            {favoriteStacks.length > 0 ? (
              <div className="space-y-2">
                {favoriteStacks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5"
                  >
                    <Link
                      href="/stacks"
                      className="block rounded-lg outline-none transition hover:opacity-80 focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {item.name}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-5 text-sm text-[var(--color-muted)]">
                No favorite stacks yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </p>
      <p className="mt-1.5 break-words text-xl font-semibold leading-tight text-[var(--color-text)] sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
        {subtitle}
      </p>
      {href ? (
        <div className="mt-2 text-xs font-medium text-[var(--color-accent)]">
          Open →
        </div>
      ) : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      {content}
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <h3 className="text-sm font-semibold text-[var(--color-text)] sm:text-base">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)] sm:text-sm sm:leading-6">
        {description}
      </p>
      <div className="mt-2 text-sm font-medium text-[var(--color-accent)]">
        Open →
      </div>
    </Link>
  );
}