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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">
          Personal reference logging only. This feature does not provide medical
          advice or treatment guidance.
        </p>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          Injection Logging
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Log injections, track site rotation, and keep a complete history in a
          mobile-friendly format.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Log New Injection
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Use the body map below in the form to choose the injection site.
            </p>
          </div>

          <NewInjectionLogForm
            peptides={peptides ?? []}
            plans={plans}
            initialPlanId={initialPlanId}
            initialInjectionAt={initialInjectionAt}
          />
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text)]">
                Injection History
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Your recent entries, newest first.
              </p>
            </div>

            <span className="inline-flex self-start rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          <div className="grid gap-4">
            {!logs.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No injections logged yet.
              </div>
            ) : (
              logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">
                          {log.peptide?.name || "Unknown peptide"}
                        </h3>

                        {log.peptide?.category ? (
                          <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
                            {log.peptide.category}
                          </span>
                        ) : null}
                      </div>

                      <dl className="mt-3 grid gap-2 text-sm text-[var(--color-muted)]">
                        <div className="flex flex-wrap gap-2">
                          <dt className="font-medium text-[var(--color-text)]">
                            Date:
                          </dt>
                          <dd>{new Date(log.injection_at).toLocaleString()}</dd>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <dt className="font-medium text-[var(--color-text)]">
                            Dose:
                          </dt>
                          <dd>
                            {log.dose_amount} {log.dose_unit}
                          </dd>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <dt className="font-medium text-[var(--color-text)]">
                            Site:
                          </dt>
                          <dd>{log.site}</dd>
                        </div>

                        {log.plan?.plan_name ? (
                          <div className="flex flex-wrap gap-2">
                            <dt className="font-medium text-[var(--color-text)]">
                              Plan:
                            </dt>
                            <dd>{log.plan.plan_name}</dd>
                          </div>
                        ) : null}

                        {log.notes ? (
                          <div className="mt-1">
                            <dt className="font-medium text-[var(--color-text)]">
                              Notes:
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap text-[var(--color-muted)]">
                              {log.notes}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>

                    <div className="shrink-0 self-start">
                      <InjectionLogActions logId={log.id} />
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}