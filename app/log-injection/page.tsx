import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewInjectionLogForm from "@/components/NewInjectionLogForm";
import InjectionLogActions from "@/components/InjectionLogActions";

type PeptideRelation = {
  id: string;
  name: string;
  category: string | null;
};

type PlanRelation = {
  id: string;
  plan_name: string;
};

type InjectionLog = {
  id: string;
  injection_at: string;
  dose_amount: number;
  dose_unit: string;
  site: string;
  notes: string | null;
  created_at: string;
  peptide: PeptideRelation | null;
  plan: PlanRelation | null;
};

type ActivePlan = {
  id: string;
  plan_name: string;
  peptide_id: string;
  active: boolean;
};

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeInjectionLogs(rawLogs: any[]): InjectionLog[] {
  return rawLogs.map((log) => ({
    id: log.id,
    injection_at: log.injection_at,
    dose_amount: log.dose_amount,
    dose_unit: log.dose_unit,
    site: log.site,
    notes: log.notes ?? null,
    created_at: log.created_at,
    peptide: normalizeSingleRelation<PeptideRelation>(log.peptide),
    plan: normalizeSingleRelation<PlanRelation>(log.plan),
  }));
}

function normalizeActivePlans(rawPlans: any[]): ActivePlan[] {
  return rawPlans.map((plan) => ({
    id: plan.id,
    plan_name: plan.plan_name,
    peptide_id: plan.peptide_id,
    active: Boolean(plan.active),
  }));
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function LogInjectionPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; injectionAt?: string }>;
}) {
  const { planId = "", injectionAt = "" } = await searchParams;

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
        ),
        plan:injection_plans (
          id,
          plan_name
        )
      `
    )
    .eq("user_id", user.id)
    .order("injection_at", { ascending: false });

  if (logsError) {
    throw new Error(logsError.message);
  }

  const plans = normalizeActivePlans(rawPlans ?? []);
  const logs = normalizeInjectionLogs(rawLogs ?? []);

  const initialPlanId = plans.some((plan) => plan.id === planId) ? planId : "";
  const initialInjectionAt = injectionAt ? toDateTimeLocalValue(injectionAt) : "";

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Injection Logging
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Log your injections and keep a complete wellness history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Log New Injection
          </h2>

          <div className="mt-4">
            <NewInjectionLogForm
              peptides={peptides ?? []}
              plans={plans}
              initialPlanId={initialPlanId}
              initialInjectionAt={initialInjectionAt}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Injection History
          </h2>

          <div className="mt-4 grid gap-4">
            {!logs.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No injections logged yet.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {log.peptide?.name || "Unknown peptide"}
                      </h3>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Date: {new Date(log.injection_at).toLocaleString()}
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Dose: {log.dose_amount} {log.dose_unit}
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Site: {log.site}
                      </p>

                      {log.plan?.plan_name ? (
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          Plan: {log.plan.plan_name}
                        </p>
                      ) : null}

                      {log.notes ? (
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          Notes: {log.notes}
                        </p>
                      ) : null}
                    </div>

                    <InjectionLogActions logId={log.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}