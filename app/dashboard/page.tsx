import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
  injection_at: string;
};

type PlanRow = {
  id: string;
  plan_name: string;
  active: boolean;
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  const [
    { data: logs, error: logsError },
    { data: plans, error: plansError },
    { data: reminders, error: remindersError },
  ] = await Promise.all([
    supabase
      .from("injection_logs")
      .select("injection_at")
      .eq("user_id", user.id)
      .order("injection_at", { ascending: false })
      .limit(20),

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
  ]);

  if (logsError) throw new Error(logsError.message);
  if (plansError) throw new Error(plansError.message);
  if (remindersError) throw new Error(remindersError.message);

  const typedLogs: InjectionLogRow[] = logs ?? [];
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
      href: "/wellness",
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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Your current status, reminders, and next actions.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Today
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              A quick view of where things stand right now.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              adherenceTone === "green"
                ? "bg-green-50 text-green-700"
                : adherenceTone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            Adherence {adherence}%
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Last injection"
            value={lastInjection ? formatLocalDate(lastInjection) : "—"}
            subtitle={
              daysSinceLast !== null
                ? `${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago`
                : "No logged injections yet"
            }
          />

          <StatCard
            title="Next reminder"
            value={
              nextUnresolvedReminder
                ? formatLocalDate(nextUnresolvedReminder.reminder_for)
                : "—"
            }
            subtitle={
              nextUnresolvedReminder
                ? `${
                    nextUnresolvedReminder.plan?.plan_name || "Planned injection"
                  } · ${formatLocalDateTime(nextUnresolvedReminder.reminder_for)}`
                : "No upcoming unresolved reminders"
            }
            href={nextUnresolvedReminder ? nextReminderHref : undefined}
          />

          <StatCard
            title="Missed reminders"
            value={String(unresolvedMissedReminders.length)}
            subtitle="Unresolved planned injections"
          />

          <StatCard
            title="Active plans"
            value={String(typedPlans.length)}
            subtitle="Currently running"
          />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Alerts
        </h2>

        <div className="mt-4 grid gap-3">
          {!alerts.length ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)] sm:p-5">
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

      <section className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2">
        <ActionCard
          title="Log injection"
          description="Record a new injection and keep reminders in sync."
          href="/log-injection"
        />
        <ActionCard
          title="View wellness"
          description="Review trends, missed reminders, and overall adherence."
          href="/wellness"
        />
        <ActionCard
          title="Manage plans"
          description="Create, update, and organize your active protocols."
          href="/plans"
        />
        <ActionCard
          title="Browse peptides"
          description="Open the peptide library and review research details."
          href="/peptides"
        />
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Quick status
        </h2>

        <div className="mt-4 grid gap-3">
          <StatusRow
            label="Last logged injection"
            value={
              lastInjection
                ? formatLocalDateTime(lastInjection)
                : "No injections logged yet"
            }
          />
          <StatusRow
            label="Next unresolved reminder"
            value={
              nextUnresolvedReminder
                ? `${nextUnresolvedReminder.plan?.plan_name || "Plan"} · ${formatLocalDateTime(
                    nextUnresolvedReminder.reminder_for
                  )}`
                : "No upcoming unresolved reminders"
            }
            href={nextUnresolvedReminder ? nextReminderHref : undefined}
          />
          <StatusRow
            label="Unresolved reminders"
            value={`${unresolvedMissedReminders.length} reminder${
              unresolvedMissedReminders.length === 1 ? "" : "s"
            }`}
          />
          <StatusRow
            label="Completed reminders"
            value={`${completedReminders} of ${totalReminders || 0}`}
          />
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </p>
      <p className="mt-1 break-words text-lg font-semibold text-[var(--color-text)] sm:text-xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
        {subtitle}
      </p>
      {href ? (
        <div className="mt-3 text-xs font-medium text-[var(--color-accent)]">
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
      className="group rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-5"
    >
      <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
      <div className="mt-3 text-sm font-medium text-[var(--color-accent)]">
        Open →
      </div>
    </Link>
  );
}

function StatusRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </span>
        <span className="break-words text-sm text-[var(--color-muted)] sm:text-right">
          {value}
        </span>
      </div>
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