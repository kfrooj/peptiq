"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createInjectionLog } from "@/app/(protected)/log-injection/actions";

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
  initialPlanId?: string;
  initialInjectionAt?: string;
};

type InjectionSite =
  | "Left upper arm"
  | "Right upper arm"
  | "Left abdomen"
  | "Right abdomen"
  | "Left thigh"
  | "Right thigh"
  | "Left glute"
  | "Right glute";

type Hotspot = {
  id: InjectionSite;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

const HOTSPOTS: Hotspot[] = [
  {
    id: "Left upper arm",
    label: "Left arm",
    left: "11.8%",
    top: "27%",
    width: "5.2%",
    height: "9.0%",
  },
  {
    id: "Right upper arm",
    label: "Right arm",
    left: "39.2%",
    top: "27%",
    width: "5.2%",
    height: "9.0%",
  },
  {
    id: "Left abdomen",
    label: "Left abdomen",
    left: "20.1%",
    top: "35.0%",
    width: "6.9%",
    height: "6.1%",
  },
  {
    id: "Right abdomen",
    label: "Right abdomen",
    left: "30.4%",
    top: "35%",
    width: "6.9%",
    height: "6.1%",
  },
  {
    id: "Left thigh",
    label: "Left thigh",
    left: "17%",
    top: "45%",
    width: "7.1%",
    height: "12.0%",
  },
  {
    id: "Right thigh",
    label: "Right thigh",
    left: "33%",
    top: "45%",
    width: "7.1%",
    height: "12.0%",
  },
  {
    id: "Left upper arm",
    label: "Left arm",
    left: "55.7%",
    top: "27%",
    width: "5.2%",
    height: "9.0%",
  },
  {
    id: "Right upper arm",
    label: "Right arm",
    left: "84%",
    top: "27%",
    width: "5.2%",
    height: "9.0%",
  },
  {
    id: "Left glute",
    label: "Left glute",
    left: "62%",
    top: "42%",
    width: "7.3%",
    height: "6.6%",
  },
  {
    id: "Right glute",
    label: "Right glute",
    left: "76%",
    top: "42%",
    width: "7.3%",
    height: "6.6%",
  },
  {
    id: "Left thigh",
    label: "Left thigh",
    left: "60%",
    top: "48%",
    width: "6.9%",
    height: "11.6%",
  },
  {
    id: "Right thigh",
    label: "Right thigh",
    left: "78%",
    top: "48%",
    width: "6.9%",
    height: "11.6%",
  },
];

export default function NewInjectionLogForm({
  peptides,
  plans,
  initialPlanId = "",
  initialInjectionAt = "",
}: Props) {
  const [peptideId, setPeptideId] = useState("");
  const [planId, setPlanId] = useState(initialPlanId);
  const [injectionAt, setInjectionAt] = useState(initialInjectionAt);
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("mcg");
  const [site, setSite] = useState<InjectionSite | "">("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPlanId(initialPlanId);
  }, [initialPlanId]);

  useEffect(() => {
    setInjectionAt(initialInjectionAt);
  }, [initialInjectionAt]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [plans, planId]
  );

  const lockedToPlan = useMemo(() => {
    return Boolean(initialPlanId && plans.length === 1 && plans[0]?.id === initialPlanId);
  }, [initialPlanId, plans]);

  const selectedPeptide = useMemo(
    () => peptides.find((peptide) => peptide.id === peptideId) ?? null,
    [peptides, peptideId]
  );

  useEffect(() => {
    if (selectedPlan) {
      setPeptideId(selectedPlan.peptide_id);
    }
  }, [selectedPlan]);

  function resetForm() {
    setPeptideId(selectedPlan?.peptide_id ?? "");
    setPlanId(initialPlanId);
    setInjectionAt(initialInjectionAt);
    setDoseAmount("");
    setDoseUnit("mcg");
    setSite("");
    setNotes("");
  }

  function handleSubmit() {
    setMessage("");
    setError("");

    if (!peptideId) {
      setError("Please select a peptide.");
      return;
    }

    if (!injectionAt) {
      setError("Please choose an injection date and time.");
      return;
    }

    if (!doseAmount || Number(doseAmount) <= 0) {
      setError("Please enter a valid dose amount.");
      return;
    }

    if (!site) {
      setError("Please select an injection site.");
      return;
    }

    startTransition(async () => {
      const result = await createInjectionLog({
        peptideId,
        planId: planId || null,
        injectionAt,
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
    <div className="grid gap-5">
      {lockedToPlan && selectedPlan ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan">
            <div className="w-full rounded-xl border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)]">
              {selectedPlan.plan_name}
            </div>
          </Field>

          <Field label="Peptide">
            <div className="w-full rounded-xl border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)]">
              {selectedPeptide?.name ?? "Linked peptide"}
            </div>
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan">
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm"
            >
              <option value="">No linked plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Peptide">
            <select
              value={peptideId}
              onChange={(e) => setPeptideId(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm"
            >
              <option value="">Select a peptide</option>
              {peptides.map((peptide) => (
                <option key={peptide.id} value={peptide.id}>
                  {peptide.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <Field label="Injection date and time">
        <input
          type="datetime-local"
          value={injectionAt}
          onChange={(e) => setInjectionAt(e.target.value)}
          className="w-full rounded-xl border px-4 py-3 text-sm"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dose amount">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={doseAmount}
            onChange={(e) => setDoseAmount(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
        </Field>

        <Field label="Dose unit">
          <select
            value={doseUnit}
            onChange={(e) => setDoseUnit(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm"
          >
            <option value="mcg">mcg</option>
            <option value="mg">mg</option>
            <option value="IU">IU</option>
            <option value="mL">mL</option>
          </select>
        </Field>
      </div>

      <div className="rounded-3xl border bg-[var(--color-surface-muted)] p-4">
        <div className="mb-4">
          <h3 className="font-semibold">Injection site</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Tap a body area to choose the site.
          </p>
        </div>

        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-white">
          <div className="relative aspect-[1024/1536] w-full">
            <Image
              src="/injection-sites-body-map-v2.png"
              alt="Injection body map"
              fill
              className="object-contain"
              priority
            />

            {HOTSPOTS.map((spot, i) => {
              const active = site === spot.id;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSite(spot.id)}
                  className={`absolute rounded-[40%] border-2 transition ${
                    active
                      ? "border-red-600 bg-red-500/22 ring-2 ring-red-300"
                      : "border-red-500/80 bg-red-400/10 hover:bg-red-400/18"
                  }`}
                  style={{
                    left: spot.left,
                    top: spot.top,
                    width: spot.width,
                    height: spot.height,
                  }}
                  aria-label={spot.label}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-sm">
          Selected: <strong>{site || "None"}</strong>
        </div>
      </div>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border px-4 py-3 text-sm"
        />
      </Field>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-3 text-white"
      >
        {isPending ? "Saving..." : "Log injection"}
      </button>

      {message ? <div className="text-green-600">{message}</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}