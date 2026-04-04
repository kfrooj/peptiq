"use client";

import { useState, useTransition } from "react";
import { createInjectionPlan } from "@/app/plans/actions";

type Peptide = {
  id: string;
  name: string;
  category: string | null;
};

type Props = {
  peptides: Peptide[];
};

export default function NewInjectionPlanForm({ peptides }: Props) {
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
      setError("Please choose a default reminder time.");
      return;
    }

    if (
      frequencyType === "every_x_days" &&
      (!frequencyValue || Number(frequencyValue) < 1)
    ) {
      setError("Please enter how many days for the frequency.");
      return;
    }

    if (!reminderOffsetHours || Number(reminderOffsetHours) < 1) {
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
        notes: notes || null,
      });

      if (result.success) {
        setMessage("Plan created successfully.");
        resetForm();
      } else {
        setError(result.error || "Could not create plan.");
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
          onChange={(e) => setPeptideId(e.target.value)}
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
          Plan name
        </label>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Example: Morning Recovery Plan"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Frequency
          </label>
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="every_x_days">Every X Days</option>
          </select>
        </div>

        {frequencyType === "every_x_days" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Every how many days?
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(e.target.value)}
              placeholder="Example: 3"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            End date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Injection time
        </label>
        <input
          type="time"
          value={defaultTime}
          onChange={(e) => setDefaultTime(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        />
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          This is the planned injection time used to calculate reminder timing.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          Reminder Settings
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        </div>

        {remindersEnabled ? (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Remind me how many hours before?
            </label>
            <select
              value={reminderOffsetHours}
              onChange={(e) => setReminderOffsetHours(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            >
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
            </select>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Example: rotate left/right abdomen and log any reactions"
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
        {isPending ? "Saving..." : "Create plan"}
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