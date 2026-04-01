"use client";

import { useMemo, useState } from "react";

const vialOptions = [
  { label: "1 mg", value: 1 },
  { label: "2 mg", value: 2 },
  { label: "5 mg", value: 5 },
  { label: "10 mg", value: 10 },
];

const syringeOptions = [
  { label: "0.3 mL (30 IU)", ml: 0.3, iu: 30 },
  { label: "0.5 mL (50 IU)", ml: 0.5, iu: 50 },
  { label: "1.0 mL (100 IU)", ml: 1.0, iu: 100 },
];

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

export default function PeptideCalculator() {
  const [useCustomVial, setUseCustomVial] = useState(false);
  const [selectedVialMg, setSelectedVialMg] = useState(5);
  const [customVialMg, setCustomVialMg] = useState("5");
  const [mixingVolumeMl, setMixingVolumeMl] = useState("2");
  const [desiredAmountMcg, setDesiredAmountMcg] = useState("250");
  const [selectedSyringeMl, setSelectedSyringeMl] = useState("1");

  const results = useMemo(() => {
    const vialMg = useCustomVial ? Number(customVialMg) : selectedVialMg;
    const mixingMl = Number(mixingVolumeMl);
    const desiredMcg = Number(desiredAmountMcg);
    const syringeMl = Number(selectedSyringeMl);

    if (
      !Number.isFinite(vialMg) ||
      !Number.isFinite(mixingMl) ||
      !Number.isFinite(desiredMcg) ||
      !Number.isFinite(syringeMl) ||
      vialMg <= 0 ||
      mixingMl <= 0 ||
      desiredMcg <= 0 ||
      syringeMl <= 0
    ) {
      return null;
    }

    const concentrationMcgPerMl = (vialMg * 1000) / mixingMl;
    const concentrationMcgPer01Ml = concentrationMcgPerMl / 100;
    const requiredVolumeMl = desiredMcg / concentrationMcgPerMl;
    const requiredIU = requiredVolumeMl * 100;
    const syringeCapacityIU = syringeMl * 100;
    const exceedsSyringe = requiredVolumeMl > syringeMl;

    return {
      vialMg,
      mixingMl,
      desiredMcg,
      concentrationMcgPerMl: round(concentrationMcgPerMl, 2),
      concentrationMcgPer01Ml: round(concentrationMcgPer01Ml, 2),
      requiredVolumeMl: round(requiredVolumeMl, 3),
      requiredIU: round(requiredIU, 1),
      syringeCapacityIU,
      exceedsSyringe,
    };
  }, [
    useCustomVial,
    selectedVialMg,
    customVialMg,
    mixingVolumeMl,
    desiredAmountMcg,
    selectedSyringeMl,
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          Inputs
        </h2>

        <div className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Peptide amount in vial
            </label>

            <div className="flex flex-wrap gap-2">
              {vialOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setUseCustomVial(false);
                    setSelectedVialMg(option.value);
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    !useCustomVial && selectedVialMg === option.value
                      ? "border-transparent bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setUseCustomVial(true)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  useCustomVial
                    ? "border-transparent bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)]"
                }`}
              >
                Custom
              </button>
            </div>

            {useCustomVial ? (
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={customVialMg}
                onChange={(e) => setCustomVialMg(e.target.value)}
                className="mt-3 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
                placeholder="Enter mg"
              />
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Mixing volume (mL)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={mixingVolumeMl}
              onChange={(e) => setMixingVolumeMl(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Desired sample size (mcg)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={desiredAmountMcg}
              onChange={(e) => setDesiredAmountMcg(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Syringe size
            </label>
            <select
              value={selectedSyringeMl}
              onChange={(e) => setSelectedSyringeMl(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            >
              {syringeOptions.map((option) => (
                <option key={option.ml} value={option.ml}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          Results
        </h2>

        {!results ? (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Enter valid values to calculate results.
          </p>
        ) : (
          <div className="mt-6 grid gap-4">
            <ResultCard
              label="Concentration"
              value={`${results.concentrationMcgPerMl} mcg/mL`}
            />
            <ResultCard
              label="Per 0.01 mL"
              value={`${results.concentrationMcgPer01Ml} mcg`}
            />
            <ResultCard
              label="Required volume"
              value={`${results.requiredVolumeMl} mL`}
            />
            <ResultCard
              label="Syringe units"
              value={`${results.requiredIU} IU`}
            />

            {results.exceedsSyringe ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                Warning: the required volume exceeds the selected syringe capacity.
                Choose a larger syringe or adjust the mix volume.
              </div>
            ) : (
              <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                The required volume fits within the selected syringe size.
              </div>
            )}

            <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
              <p>1 mg = 1000 mcg</p>
              <p>1 mL = 100 IU</p>
              <p>1 IU = 0.01 mL</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}