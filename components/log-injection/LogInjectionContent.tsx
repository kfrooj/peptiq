import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewInjectionLogForm from "@/components/NewInjectionLogForm";
import InjectionHistoryTable, {
  type InjectionActivityRow,
} from "@/components/log-injection/InjectionHistoryTable";

type ActivePlan = {
  id: string;
  plan_name: string;
  peptide_id: string;
  active: boolean;
};

type PeptideRow = {
  id: string;
  name: string;
  category: string | null;
};

type RawLogRow = {
  id: string;
  injection_at: string;
  dose_amount: number;
  dose_unit: string;
  site: string;
  notes: string | null;
  created_at: string;
  peptide:
    | {
        id: string;
        name: string;
        category: string | null;
      }
    | {
        id: string;
        name: string;
        category: string | null;
      }[]
    | null;
};

type RawReminderRow = {
  id: string;
  plan_id: string | null;
  reminder_for: string;
  is_completed: boolean;
  status: string | null;
};

function normalizeActivePlans(rawPlans: any[]): ActivePlan[] {
  return rawPlans.map((plan) => ({
    id: plan.id,
    plan_name: plan.plan_name,
    peptide_id: plan.peptide_id,
    active: Boolean(plan.active),
  }));
}

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function LogInjectionContent({
  searchParams,
}: {
  searchParams?: Promise<{
    planId?: string;
    injectionAt?: string;
    status?: string;
  }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const planId = resolvedSearchParams.planId ?? "";
  const injectionAt = resolvedSearchParams.injectionAt ?? "";
  const statusParam = resolvedSearchParams.status;

  const initialStatus: "upcoming" | "missed" | "done" =
    statusParam === "missed"
      ? "missed"
      : statusParam === "done"
        ? "done"
        : "upcoming";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nowIso = new Date().toISOString();

  const [
    { data: peptides, error: peptidesError },
    { data: rawPlans, error: plansError },
    { data: rawLogs, error: logsError },
    { data: rawPastReminders, error: pastRemindersError },
    { data: rawUpcomingReminders, error: upcomingRemindersError },
  ] = await Promise.all([
    supabase
      .from("peptides")
      .select("id, name, category")
      .eq("published", true)
      .order("name", { ascending: true }),

    supabase
      .from("injection_plans")
      .select("id, plan_name, peptide_id, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("injection_logs")
      .select(
        `
          id,
          injection_at,
          dose_amount,
          dose_unit,
          site,
          notes,
          created_at,
          peptide:peptides (
            id,
            name,
            category
          )
        `
      )
      .eq("user_id", user.id)
      .order("injection_at", { ascending: false }),

    supabase
      .from("plan_reminders")
      .select("id, plan_id, reminder_for, is_completed, status")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .lt("reminder_for", nowIso)
      .in("status", ["pending", "sent"])
      .order("reminder_for", { ascending: false }),

    supabase
      .from("plan_reminders")
      .select("id, plan_id, reminder_for, is_completed, status")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .gte("reminder_for", nowIso)
      .in("status", ["pending", "sent"])
      .order("reminder_for", { ascending: true }),
  ]);

  if (peptidesError) {
    throw new Error(peptidesError.message);
  }

  if (plansError) {
    throw new Error(plansError.message);
  }

  if (logsError) {
    throw new Error(logsError.message);
  }

  if (pastRemindersError) {
    throw new Error(pastRemindersError.message);
  }

  if (upcomingRemindersError) {
    throw new Error(upcomingRemindersError.message);
  }

  const plans = normalizeActivePlans(rawPlans ?? []);
  const peptidesList = (peptides ?? []) as PeptideRow[];

  const peptidesById = new Map(peptidesList.map((peptide) => [peptide.id, peptide]));
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
  const lockedToPlan = Boolean(selectedPlan);

  const formPlans = lockedToPlan && selectedPlan ? [selectedPlan] : plans;
  const initialPlanId = lockedToPlan && selectedPlan ? selectedPlan.id : "";
  const initialInjectionAt = injectionAt ? toDateTimeLocalValue(injectionAt) : "";

  const doneItems: InjectionActivityRow[] = ((rawLogs ?? []) as RawLogRow[]).map(
    (log) => {
      const peptide = normalizeSingleRelation(log.peptide);

      return {
        id: log.id,
        type: "done",
        scheduled_at: log.injection_at,
        dose_amount: log.dose_amount,
        dose_unit: log.dose_unit,
        peptide_name: peptide?.name ?? "Unknown peptide",
      };
    }
  );

  const missedItems: InjectionActivityRow[] = (
    (rawPastReminders ?? []) as RawReminderRow[]
  )
    .map((reminder) => {
      const plan = reminder.plan_id ? plansById.get(reminder.plan_id) : null;
      const peptide = plan ? peptidesById.get(plan.peptide_id) : null;

      return {
        id: reminder.id,
        type: "missed" as const,
        scheduled_at: reminder.reminder_for,
        plan_id: reminder.plan_id,
        plan_name: plan?.plan_name ?? "Unlinked plan",
        peptide_name: peptide?.name ?? "Unknown peptide",
      };
    })
    .filter((item) => Boolean(item.plan_id));

  const upcomingItems: InjectionActivityRow[] = (
    (rawUpcomingReminders ?? []) as RawReminderRow[]
  )
    .map((reminder) => {
      const plan = reminder.plan_id ? plansById.get(reminder.plan_id) : null;
      const peptide = plan ? peptidesById.get(plan.peptide_id) : null;

      return {
        id: reminder.id,
        type: "upcoming" as const,
        scheduled_at: reminder.reminder_for,
        plan_id: reminder.plan_id,
        plan_name: plan?.plan_name ?? "Unlinked plan",
        peptide_name: peptide?.name ?? "Unknown peptide",
      };
    })
    .filter((item) => Boolean(item.plan_id));

  const activityItems: InjectionActivityRow[] = [
    ...upcomingItems,
    ...missedItems,
    ...doneItems,
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Personal reference logging only. PEPT|IQ does not provide medical advice or treatment guidance.
        </p>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          Log Injection
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Log injections, track site rotation, and keep a complete history in a
          compact mobile-friendly format.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Log Injection
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Complete the form below and use the body map to choose the injection site.
            </p>
          </div>

          {lockedToPlan && selectedPlan ? (
            <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
              <p className="text-sm text-[var(--color-muted)]">Logging for</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {selectedPlan.plan_name}
              </p>
            </div>
          ) : null}

          <NewInjectionLogForm
            peptides={peptidesList}
            plans={formPlans}
            initialPlanId={initialPlanId}
            initialInjectionAt={initialInjectionAt}
          />
        </section>

        <InjectionHistoryTable
          items={activityItems}
          initialStatus={initialStatus}
        />
      </div>
    </main>
  );
}