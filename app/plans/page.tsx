import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewInjectionPlanForm from "@/components/NewInjectionPlanForm";
import InjectionPlanActions from "@/components/InjectionPlanActions";

type PeptideRelation = {
  id: string;
  name: string;
  category: string | null;
};

type InjectionPlan = {
  id: string;
  plan_name: string;
  dose_amount: number;
  dose_unit: string;
  frequency_type: string;
  frequency_value: number | null;
  start_date: string;
  end_date: string | null;
  default_time: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  peptide: PeptideRelation | null;
};

function normalizeSingleRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeInjectionPlans(rawPlans: any[]): InjectionPlan[] {
  return rawPlans.map((plan) => ({
    id: plan.id,
    plan_name: plan.plan_name,
    dose_amount: plan.dose_amount,
    dose_unit: plan.dose_unit,
    frequency_type: plan.frequency_type,
    frequency_value: plan.frequency_value ?? null,
    start_date: plan.start_date,
    end_date: plan.end_date ?? null,
    default_time: plan.default_time ?? null,
    active: Boolean(plan.active),
    notes: plan.notes ?? null,
    created_at: plan.created_at,
    peptide: normalizeSingleRelation<PeptideRelation>(plan.peptide),
  }));
}

export default async function PlansPage() {
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
    .select(
      `
        id,
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
        peptide:peptides (
          id,
          name,
          category
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const plans = normalizeInjectionPlans(rawPlans ?? []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Injection Plans
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Create and manage your peptide injection plans.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Create New Plan
          </h2>

          <div className="mt-4">
            <NewInjectionPlanForm peptides={peptides ?? []} />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Your Plans
          </h2>

          <div className="mt-4 grid gap-4">
            {!plans.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No injection plans yet.
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {plan.plan_name}
                      </h3>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Peptide: {plan.peptide?.name || "Unknown peptide"}
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Dose: {plan.dose_amount} {plan.dose_unit}
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Frequency:{" "}
                        {plan.frequency_type === "every_x_days" &&
                        plan.frequency_value
                          ? `Every ${plan.frequency_value} days`
                          : plan.frequency_type}
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Start: {plan.start_date}
                      </p>

                      {plan.end_date ? (
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          End: {plan.end_date}
                        </p>
                      ) : null}

                      {plan.default_time ? (
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          Default time: {plan.default_time}
                        </p>
                      ) : null}

                      {plan.notes ? (
                        <p className="mt-2 text-sm text-[var(--color-muted)]">
                          Notes: {plan.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          plan.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {plan.active ? "Active" : "Inactive"}
                      </span>

                      <InjectionPlanActions
                        planId={plan.id}
                        active={plan.active}
                      />
                    </div>
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