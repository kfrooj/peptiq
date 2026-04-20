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

const fieldClassName =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]";

export default function NewInjectionLogForm({
  peptides,
  plans,
  initialPlanId = "",
  initialInjectionAt = "",
}: Props) {
  const [peptideId, setPeptideId] = useState<string>("");
  const [planId, setPlanId] = useState<string>(initialPlanId ?? "");
  const [injectionAt, setInjectionAt] = useState<string>(initialInjectionAt ?? "");
  const [doseAmount, setDoseAmount] = useState<string>("");
  const [doseUnit, setDoseUnit] = useState<string>("mcg");
  const [site, setSite] = useState<InjectionSite | "">("");
  const [notes, setNotes] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPlanId(initialPlanId ?? "");
  }, [initialPlanId]);

  useEffect(() => {
    setInjectionAt(initialInjectionAt ?? "");
  }, [initialInjectionAt]);

  const selectedPlan = useMemo<Plan | null>(() => {
    return plans.find((p) => p.id === planId) ?? null;
  }, [plans, planId]);

  useEffect(() => {
    if (selectedPlan) {
      setPeptideId(selectedPlan.peptide_id ?? "");
    }
  }, [selectedPlan]);

  function handleSubmit() {
    setError("");
    setMessage("");

    if (!peptideId) {
      setError("Select peptide");
      return;
    }

    if (!injectionAt) {
      setError("Pick time");
      return;
    }

    if (!doseAmount || Number(doseAmount) <= 0) {
      setError("Enter dose");
      return;
    }

    if (!site) {
      setError("Select site");
      return;
    }

    startTransition(async () => {
      const res = await createInjectionLog({
        peptideId,
        planId: planId || null,
        injectionAt,
        doseAmount: Number(doseAmount),
        doseUnit,
        site,
        notes: notes.trim() || null,
      });

      if (res.success) {
        setMessage("Logged ✓");
        setDoseAmount("");
        setNotes("");
      } else {
        setError(res.error || "Could not log injection.");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className={fieldClassName}
        >
          <option value="">No plan</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.plan_name}
            </option>
          ))}
        </select>

        <select
          value={peptideId}
          onChange={(e) => setPeptideId(e.target.value)}
          className={fieldClassName}
          disabled={Boolean(selectedPlan)}
        >
          <option value="">Peptide</option>
          {peptides.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="datetime-local"
        value={injectionAt}
        onChange={(e) => setInjectionAt(e.target.value)}
        className={fieldClassName}
      />

      <div className="grid grid-cols-[1fr_80px] gap-2">
        <input
          type="number"
          value={doseAmount}
          onChange={(e) => setDoseAmount(e.target.value)}
          placeholder="Dose"
          className={fieldClassName}
        />

        <select
          value={doseUnit}
          onChange={(e) => setDoseUnit(e.target.value)}
          className={fieldClassName}
        >
          <option value="mcg">mcg</option>
          <option value="mg">mg</option>
          <option value="IU">iu</option>
          <option value="mL">ml</option>
        </select>
      </div>

      <div className="rounded-2xl border p-3">
        <p className="mb-2 text-xs text-[var(--color-muted)]">
          Tap injection site
        </p>

        <div className="relative mx-auto max-w-xs overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
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
                  key={`${spot.id}-${spot.left}-${spot.top}-${i}`}
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
                  title={spot.label}
                />
              );
            })}
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
          {site || "No site selected"}
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes (optional)"
        className={fieldClassName}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Log injection"}
      </button>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}