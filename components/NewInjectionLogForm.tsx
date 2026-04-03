"use client";

import { useMemo, useState, useTransition } from "react";
import { createInjectionLog } from "@/app/log-injection/actions";

type Peptide = {
  id: string;
  name: string;
  category: string | null;
};

type Plan = {
  id: string;
  plan_name: string;
  peptide_id: string;
  active: boolean;
};

type Props = {
  peptides: Peptide[];
  plans: Plan[];
};

const injectionSites = [
  "Abdomen",
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left glute",
  "Right glute",
  "Left arm",
  "Right arm",
  "Other",
];

function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function NewInjectionLogForm({ peptides, plans }: Props) {
  const [peptideId, setPeptideId] = useState("");
  const [planId, setPlanId] = useState("");
  const [injectionAt, setInjectionAt] = useState(getCurrentDateTimeLocal());
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("mcg");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredPlans = useMemo(() => {
    if (!peptideId) return plans;
    return plans.filter((plan) => plan.peptide_id === peptideId);
  }, [peptideId, plans]);

  function resetForm() {
    setPeptideId("");
    setPlanId("");
    setInjectionAt(getCurrentDateTimeLocal());
    setDoseAmount("");
    setDoseUnit("mcg");
    setSite("");
    setNotes("");
  }

  function handlePeptideChange(nextPeptideId: string) {
    setPeptideId(nextPeptideId);

    if (planId) {
      const stillValid = plans.some(
        (plan) => plan.id === planId && plan.peptide_id === nextPeptideId
      );

      if (!stillValid) {
        setPlanId("");
      }
    }
  }

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);

    if (!nextPlanId) return;

    const selectedPlan = plans.find((plan) => plan.id === nextPlanId);

    if (selectedPlan) {
      setPeptideId(selectedPlan.peptide_id);
    }
  }

  function handleSubmit() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const result = await createInjectionLog({
        peptideId,
        planId: planId || null,
        injectionAt: new Date(injectionAt).toISOString(),
        doseAmount: Number(doseAmount),
        doseUnit,
        site,
        notes: notes || null,
      });

      if (result.success) {
        setMessage("Injection logged successfully.");
        resetForm();
      } else {
        setError(result.error || "Could not log injection.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Peptide
        </label>
        <select
          value={peptideId}
          onChange={(e) => handlePeptideChange(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        >
          <option value="">Select a peptide</option>
          {peptides.map((peptide) => (
            <option key={peptide.id} value={peptide.id}>
              {peptide.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Link to plan (optional)
        </label>
        <select
          value={planId}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        >
          <option value="">No linked plan</option>
          {filteredPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.plan_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Injection date and time
        </label>
        <input
          type="datetime-local"
          value={injectionAt}
          onChange={(e) => setInjectionAt(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Dose amount
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={doseAmount}
            onChange={(e) => setDoseAmount(e.target.value)}
            placeholder="Example: 250"
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Dose unit
          </label>
          <select
            value={doseUnit}
            onChange={(e) => setDoseUnit(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="mcg">mcg</option>
            <option value="mg">mg</option>
            <option value="IU">IU</option>
            <option value="mL">mL</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Injection site
        </label>
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        >
          <option value="">Select injection site</option>
          {injectionSites.map((siteOption) => (
            <option key={siteOption} value={siteOption}>
              {siteOption}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Example: mild redness, rotated from previous right abdomen site"
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={`rounded-xl px-4 py-3 text-sm font-medium text-white transition ${
          isPending
            ? "cursor-not-allowed bg-slate-400"
            : "bg-[var(--color-accent)] hover:opacity-90"
        }`}
      >
        {isPending ? "Saving..." : "Log injection"}
      </button>

      {message ? (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}