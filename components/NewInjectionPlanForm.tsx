"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createInjectionPlan } from "@/app/(protected)/plans/actions";

type Peptide = {
  id: string;
  name: string;
  category: string | null;
};

type Props = {
  peptides: Peptide[];
  disabled?: boolean;
  disabledReason?: string;
  upgradeHref?: string;
};

const fieldClassName =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[var(--color-muted)]";

export default function NewInjectionPlanForm({
  peptides,
  disabled = false,
  disabledReason,
  upgradeHref = "/pricing",
}: Props) {
  const [peptideId, setPeptideId] = useState("");
  const [planName, setPlanName] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("mcg");
  const [frequencyType, setFrequencyType] = useState("daily");
  const [frequencyValue, setFrequencyValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [active, setActive] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderOffsetHours, setReminderOffsetHours] = useState("24");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isFormLocked = disabled;
  const isSubmitDisabled = isPending || isFormLocked;

  function resetForm() {
    setPeptideId("");
    setPlanName("");
    setDoseAmount("");
    setDoseUnit("mcg");
    setFrequencyType("daily");
    setFrequencyValue("");
    setStartDate("");
    setEndDate("");
    setDefaultTime("09:00");
    setActive(true);
    setRemindersEnabled(true);
    setReminderOffsetHours("24");
    setNotes("");
  }

  function handleSubmit() {
    if (isFormLocked) {
      setMessage("");
      setError(
        disabledReason || "Upgrade required to create another active plan."
      );
      return;
    }

    setMessage("");
    setError("");

    if (!peptideId) return setError("Select a peptide.");
    if (!planName.trim()) return setError("Enter a plan name.");
    if (!doseAmount || Number(doseAmount) <= 0) {
      return setError("Enter a valid dose.");
    }
    if (!startDate) return setError("Choose a start date.");
    if (!defaultTime) return setError("Choose a time.");

    if (
      frequencyType === "every_x_days" &&
      (!frequencyValue || Number(frequencyValue) < 1)
    ) {
      return setError("Enter days between injections.");
    }

    if (
      remindersEnabled &&
      (!reminderOffsetHours || Number(reminderOffsetHours) < 1)
    ) {
      return setError("Invalid reminder timing.");
    }

    startTransition(async () => {
      const result = await createInjectionPlan({
        peptideId,
        planName: planName.trim(),
        doseAmount: Number(doseAmount),
        doseUnit,
        frequencyType,
        frequencyValue:
          frequencyType === "every_x_days" && frequencyValue
            ? Number(frequencyValue)
            : null,
        startDate,
        endDate: endDate || null,
        defaultTime,
        active,
        remindersEnabled,
        reminderOffsetHours: Number(reminderOffsetHours),
        notes: notes.trim() || null,
      });

      if (result.success) {
        setMessage("Plan created.");
        setError("");
        resetForm();
      } else {
        setError(result.error || "Could not create plan.");
        setMessage("");
      }
    });
  }

  return (
    <div className="grid gap-3">
      {isFormLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            Upgrade required
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {disabledReason ||
              "Free includes up to 2 active plans. Upgrade to Pro."}
          </p>

          <div className="mt-3 flex gap-2">
            <Link
              href={upgradeHref}
              className="rounded-full bg-[var(--color-text)] px-3 py-2 text-sm font-semibold text-white"
            >
              Upgrade
            </Link>

            <a
              href="#your-plans"
              className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              View plans
            </a>
          </div>
        </div>
      ) : null}

      <fieldset
        disabled={isFormLocked}
        className={`grid gap-3 ${isFormLocked ? "opacity-60" : ""}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
            className={fieldClassName}
          >
            <option value="">Select peptide</option>
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Plan name"
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-3 grid-cols-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
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
            <option value="IU">IU</option>
            <option value="mL">mL</option>
          </select>
        </div>

        <div className="grid gap-3 grid-cols-2">
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value)}
            className={fieldClassName}
          >
            <option value="daily">Daily</option>
            <option value="every_x_days">Every X days</option>
          </select>

          {frequencyType === "every_x_days" ? (
            <input
              type="number"
              min="1"
              step="1"
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(e.target.value)}
              placeholder="Days"
              className={fieldClassName}
            />
          ) : (
            <div />
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClassName}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <input
          type="time"
          value={defaultTime}
          onChange={(e) => setDefaultTime(e.target.value)}
          className={fieldClassName}
        />

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 space-y-2">
          <label className="flex justify-between text-sm">
            <span>Active</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </label>

          <label className="flex justify-between text-sm">
            <span>Reminders</span>
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
            />
          </label>

          {remindersEnabled ? (
            <select
              value={reminderOffsetHours}
              onChange={(e) => setReminderOffsetHours(e.target.value)}
              className={fieldClassName}
            >
              <option value="1">1h before</option>
              <option value="6">6h before</option>
              <option value="12">12h before</option>
              <option value="24">24h before</option>
              <option value="48">48h before</option>
            </select>
          ) : null}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className={fieldClassName}
        />
      </fieldset>

      {!isFormLocked ? (
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`rounded-xl py-2.5 text-sm font-semibold text-white ${
            isSubmitDisabled
              ? "bg-slate-400"
              : "bg-[var(--color-accent)] hover:opacity-90"
          }`}
        >
          {isPending ? "Saving..." : "Create plan"}
        </button>
      ) : null}

      {message ? <div className="text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="text-sm text-rose-700">{error}</div> : null}
    </div>
  );
}