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
        disabledReason ||
          "Upgrade required to create another active plan."
      );
      return;
    }

    setMessage("");
    setError("");

    if (!peptideId) {
      setError("Please select a peptide.");
      return;
    }

    if (!planName.trim()) {
      setError("Please enter a plan name.");
      return;
    }

    if (!doseAmount || Number(doseAmount) <= 0) {
      setError("Please enter a valid dose amount.");
      return;
    }

    if (!startDate) {
      setError("Please choose a start date.");
      return;
    }

    if (!defaultTime) {
      setError("Please choose an injection time.");
      return;
    }

    if (
      frequencyType === "every_x_days" &&
      (!frequencyValue || Number(frequencyValue) < 1)
    ) {
      setError("Please enter how many days for the frequency.");
      return;
    }

    if (
      remindersEnabled &&
      (!reminderOffsetHours || Number(reminderOffsetHours) < 1)
    ) {
      setError("Please enter a valid reminder offset.");
      return;
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
        setMessage("Plan created successfully.");
        setError("");
        resetForm();
      } else {
        setError(result.error || "Could not create plan.");
        setMessage("");
      }
    });
  }

  return (
    <div className="grid gap-4">
      {isFormLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Upgrade to create more plans
              </p>
              <p className="mt-1 text-sm text-amber-800">
                {disabledReason ||
                  "Free includes up to 2 active plans. Upgrade to Pro for unlimited plans, or archive an existing one first."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={upgradeHref}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-white"
              >
                Upgrade to Pro
              </Link>

              <a
                href="#your-plans"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)]"
              >
                Review plans
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <fieldset
        disabled={isFormLocked}
        className={`grid gap-4 ${isFormLocked ? "opacity-60" : ""}`}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Peptide
          </label>
          <select
            value={peptideId}
            onChange={(e) => setPeptideId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
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
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Plan name
          </label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Morning Recovery Plan"
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              Dose amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={doseAmount}
              onChange={(e) => setDoseAmount(e.target.value)}
              placeholder="250"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              Dose unit
            </label>
            <select
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
            >
              <option value="mcg">mcg</option>
              <option value="mg">mg</option>
              <option value="IU">IU</option>
              <option value="mL">mL</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              Frequency
            </label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
            >
              <option value="daily">Daily</option>
              <option value="every_x_days">Every X days</option>
            </select>
          </div>

          {frequencyType === "every_x_days" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                Repeat every
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(e.target.value)}
                placeholder="3"
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Injection time
          </label>
          <input
            type="time"
            value={defaultTime}
            onChange={(e) => setDefaultTime(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
          />
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            Used to calculate reminder timing.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            Plan settings
          </h3>

          <div className="mt-3 grid gap-3">
            <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Plan is active
            </label>

            <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
              />
              Enable reminders
            </label>

            {remindersEnabled ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                  Reminder timing
                </label>
                <select
                  value={reminderOffsetHours}
                  onChange={(e) => setReminderOffsetHours(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
                >
                  <option value="1">1 hour before</option>
                  <option value="6">6 hours before</option>
                  <option value="12">12 hours before</option>
                  <option value="24">24 hours before</option>
                  <option value="48">48 hours before</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Rotate left/right abdomen and log any reactions"
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm disabled:bg-gray-50"
          />
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
          isSubmitDisabled
            ? "cursor-not-allowed bg-slate-400"
            : "bg-[var(--color-accent)] hover:opacity-90"
        }`}
      >
        {isFormLocked
          ? "Upgrade to create a plan"
          : isPending
            ? "Saving..."
            : "Create plan"}
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