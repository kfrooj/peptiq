import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewInjectionLogForm from "@/components/NewInjectionLogForm";
import InjectionHistoryTable from "@/components/log-injection/InjectionHistoryTable";

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
  searchParams?: Promise<{ planId?: string; injectionAt?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const planId = resolvedSearchParams.planId ?? "";
  const injectionAt = resolvedSearchParams.injectionAt ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: peptides, error: peptidesError } = await supabase
    .from("peptides")
    .select("id, name, category")
    .eq("published", true)
    .order("name", { ascending: true });

  if (peptidesError) {
    throw new Error(peptidesError.message);
  }

  const { data: rawPlans, error: plansError } = await supabase
    .from("injection_plans")
    .select("id, plan_name, peptide_id, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const { data: rawLogs, error: logsError } = await supabase
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
    .order("injection_at", { ascending: false });

  if (logsError) {
    throw new Error(logsError.message);
  }

  const plans = normalizeActivePlans(rawPlans ?? []);

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
  const lockedToPlan = Boolean(selectedPlan);

  const formPlans = lockedToPlan && selectedPlan ? [selectedPlan] : plans;
  const initialPlanId = lockedToPlan && selectedPlan ? selectedPlan.id : "";
  const initialInjectionAt = injectionAt ? toDateTimeLocalValue(injectionAt) : "";

  const historyLogs = ((rawLogs ?? []) as RawLogRow[]).map((log) => {
    const peptide = normalizeSingleRelation(log.peptide);

    return {
      id: log.id,
      injection_at: log.injection_at,
      dose_amount: log.dose_amount,
      dose_unit: log.dose_unit,
      peptide_name: peptide?.name ?? "Unknown peptide",
    };
  });

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
            peptides={(peptides ?? []) as PeptideRow[]}
            plans={formPlans}
            initialPlanId={initialPlanId}
            initialInjectionAt={initialInjectionAt}
          />
        </section>

        <InjectionHistoryTable logs={historyLogs} />
      </div>
    </main>
  );
}