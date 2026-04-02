"use client";

import { useMemo, useState } from "react";

type Props = {
  initialPeptideName?: string;
  initialVialMg?: string;
  initialMixingVolumeMl?: string;
  initialSampleMcg?: string;
};

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

export default function PeptideCalculator({
  initialPeptideName = "",
  initialVialMg = "",
  initialMixingVolumeMl = "",
  initialSampleMcg = "",
}: Props) {
  const initialVialNumber = Number(initialVialMg);
  const matchedPreset = vialOptions.find(
    (option) => option.value === initialVialNumber
  );

  const [useCustomVial, setUseCustomVial] = useState(
    !!initialVialMg && !matchedPreset
  );
  const [selectedVialMg, setSelectedVialMg] = useState(
    matchedPreset ? matchedPreset.value : 5
  );
  const [customVialMg, setCustomVialMg] = useState(initialVialMg || "5");
  const [mixingVolumeMl, setMixingVolumeMl] = useState(
    initialMixingVolumeMl || "2"
  );
  const [desiredAmountMcg, setDesiredAmountMcg] = useState(
    initialSampleMcg || "250"
  );
  const [selectedSyringeMl, setSelectedSyringeMl] = useState("1");
  const [copied, setCopied] = useState(false);

  const selectedPeptideName = initialPeptideName;

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

  async function handleCopyResult() {
    if (!results) return;

    const lines = [];

    if (selectedPeptideName) {
      lines.push(
        `Mix: ${selectedPeptideName}, ${results.vialMg} mg in ${results.mixingMl} mL`
      );
    } else {
      lines.push(`Mix: ${results.vialMg} mg in ${results.mixingMl} mL`);
    }

    lines.push(`Dose: ${results.desiredMcg} mcg`);
    lines.push(`Volume: ${results.requiredVolumeMl} mL`);
    lines.push(`Syringe: ${results.requiredIU} IU`);

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          Inputs
        </h2>

        {selectedPeptideName ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Calculator opened for:{" "}
            <span className="font-semibold">{selectedPeptideName}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              How much peptide is in the vial?
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
              How much water are you adding (mL)?
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
              How much peptide do you want in each dose (mcg)?
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

            <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {results.desiredMcg} mcg = {results.requiredVolumeMl} mL (
                  {results.requiredIU} IU)
                </p>

                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {results.exceedsSyringe ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                Warning: the required volume exceeds the selected syringe
                capacity. Choose a larger syringe or adjust the mix volume.
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