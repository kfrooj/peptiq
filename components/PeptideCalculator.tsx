"use client";

import { useMemo, useState } from "react";

type Props = {
  initialPeptideName?: string;
  initialVialMg?: string;
  initialMixingVolumeMl?: string;
  initialSampleMcg?: string;
};

const vialOptions = [
  { label: "5 mg", value: 5 },
  { label: "10 mg", value: 10 },
  { label: "50 mg", value: 50 },
  { label: "100 mg", value: 100 },
];

const syringeOptions = [
  { label: "0.3 ml (30 iu)", ml: 0.3, iu: 30 },
  { label: "0.5 ml (50 iu)", ml: 0.5, iu: 50 },
  { label: "1.0 ml (100 iu)", ml: 1.0, iu: 100 },
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
    const dosesPerVial = (vialMg * 1000) / desiredMcg;

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
      dosesPerVial: round(dosesPerVial, 1),
      selectedSyringeMl: syringeMl,
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
              Inputs
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Adjust the vial amount, mix volume, desired dose, and syringe size.
            </p>
          </div>
        </div>

        {selectedPeptideName ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Calculator opened for:{" "}
            <span className="font-semibold">{selectedPeptideName}</span>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
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
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
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
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                How much BAC water are you adding (ml)?
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

          {results ? (
            <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Quick summary
              </p>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                <p>
                  {results.vialMg} mg mixed with {results.mixingMl} ml creates a
                  concentration of {results.concentrationMcgPerMl} mcg/ml.
                </p>
                <p>
                  A {results.desiredMcg} mcg dose requires{" "}
                  {results.requiredVolumeMl} ml, which equals {results.requiredIU} iu.
                </p>
                <p>
                  This vial provides about {results.dosesPerVial} doses at that
                  amount.
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
            <p>1 mg = 1000 mcg</p>
            <p>1 ml = 100 iu</p>
            <p>1 iu = 0.01 ml</p>
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
                Results
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                Instant result summary based on your current inputs.
              </p>
            </div>
          </div>

          {!results ? (
            <p className="mt-5 text-sm text-[var(--color-muted)]">
              Enter valid values to calculate results.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Main result
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
                  {results.requiredIU} IU
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Draw {results.requiredVolumeMl} ml for a {results.desiredMcg} mcg dose
                </p>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <ResultCard
                  label="Concentration"
                  value={`${results.concentrationMcgPerMl} mcg/ml`}
                />
                <ResultCard
                  label="Per 0.01 ml"
                  value={`${results.concentrationMcgPer01Ml} mcg`}
                />
                <ResultCard
                  label="Required volume"
                  value={`${results.requiredVolumeMl} ml`}
                />
                <ResultCard
                  label="Syringe units"
                  value={`${results.requiredIU} iu`}
                />
                <ResultCard
                  label="Doses per vial"
                  value={`${results.dosesPerVial}`}
                />
                <ResultCard
                  label="Syringe capacity"
                  value={`${results.syringeCapacityIU} iu`}
                />
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    Visual syringe guide
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Draw to {results.requiredIU} iu ({results.requiredVolumeMl} ml)
                  </p>
                </div>

                <SyringeGraphic
                  requiredIU={results.requiredIU}
                  syringeCapacityIU={results.syringeCapacityIU}
                />
              </div>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function SyringeGraphic({
  requiredIU,
  syringeCapacityIU,
}: {
  requiredIU: number;
  syringeCapacityIU: number;
}) {
  const safeCapacity = Math.max(syringeCapacityIU, 1);
  const clampedIU = Math.max(0, Math.min(requiredIU, safeCapacity));
  const fillPercent = clampedIU / safeCapacity;

  const barrelLeft = 36;
  const barrelTop = 18;
  const barrelWidth = 360;
  const barrelHeight = 44;
  const barrelRight = barrelLeft + barrelWidth;

  const stopperWidth = 10;
  const stopperLeft =
    barrelLeft + fillPercent * barrelWidth - stopperWidth / 2;

  const majorTickCount = 10;
  const minorTicksPerSection = 4;

  return (
    <div className="flex w-full flex-col items-center">
      <svg
        width="460"
        height="120"
        viewBox="0 0 460 120"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[460px]"
        aria-label="Horizontal syringe visual"
      >
        <defs>
          <linearGradient id="barrelBg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef2f7" />
          </linearGradient>

          <linearGradient id="liquidFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient id="plasticFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
        </defs>

        <line
          x1={barrelRight + 18}
          y1={barrelTop + barrelHeight / 2}
          x2={barrelRight + 46}
          y2={barrelTop + barrelHeight / 2}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <rect
          x={barrelRight + 4}
          y={barrelTop + 14}
          width="16"
          height="16"
          rx="4"
          fill="url(#plasticFill)"
          stroke="#64748b"
          strokeWidth="1"
        />

        <rect
          x="4"
          y={barrelTop + 10}
          width="20"
          height="24"
          rx="6"
          fill="url(#plasticFill)"
          stroke="#64748b"
          strokeWidth="1"
        />

        <rect
          x="24"
          y={barrelTop + 18}
          width={barrelLeft - 24}
          height="8"
          rx="3"
          fill="#94a3b8"
        />

        <rect
          x={barrelLeft}
          y={barrelTop}
          width={barrelWidth}
          height={barrelHeight}
          rx="20"
          fill="url(#barrelBg)"
          stroke="#334155"
          strokeWidth="1.5"
          filter="url(#softShadow)"
        />

        <rect
          x={barrelLeft + 2}
          y={barrelTop + 2}
          width={Math.max(fillPercent * barrelWidth - 2, 0)}
          height={barrelHeight - 4}
          rx="18"
          fill="url(#liquidFill)"
        />

        {fillPercent > 0 ? (
          <rect
            x={barrelLeft + 10}
            y={barrelTop + 6}
            width={Math.max(fillPercent * barrelWidth - 20, 0)}
            height="6"
            rx="3"
            fill="#ffffff"
            opacity="0.35"
          />
        ) : null}

        <rect
          x={Math.max(barrelLeft, Math.min(stopperLeft, barrelRight - stopperWidth))}
          y={barrelTop + 3}
          width={stopperWidth}
          height={barrelHeight - 6}
          rx="4"
          fill="#111827"
        />

        {Array.from({ length: majorTickCount + 1 }).map((_, index) => {
          const x = barrelLeft + (barrelWidth / majorTickCount) * index;
          const labelValue = Math.round((safeCapacity / majorTickCount) * index);

          return (
            <g key={`major-${index}`}>
              <line
                x1={x}
                y1={barrelTop - 2}
                x2={x}
                y2={barrelTop - 14}
                stroke="#334155"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={barrelTop + barrelHeight + 18}
                fontSize="10"
                textAnchor="middle"
                fill="#475569"
              >
                {labelValue}
              </text>
            </g>
          );
        })}

        {Array.from({ length: majorTickCount }).map((_, sectionIndex) => {
          const sectionStart =
            barrelLeft + (barrelWidth / majorTickCount) * sectionIndex;
          const sectionWidth = barrelWidth / majorTickCount;

          return Array.from({ length: minorTicksPerSection }).map((_, minorIndex) => {
            const x =
              sectionStart +
              (sectionWidth / (minorTicksPerSection + 1)) * (minorIndex + 1);

            return (
              <line
                key={`minor-${sectionIndex}-${minorIndex}`}
                x1={x}
                y1={barrelTop - 2}
                x2={x}
                y2={barrelTop - 9}
                stroke="#64748b"
                strokeWidth="1"
              />
            );
          });
        })}
      </svg>

      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Draw to {clampedIU.toFixed(1)} IU
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          This visual is scaled to a {safeCapacity.toFixed(0)} IU syringe
        </p>
      </div>
    </div>
  );
}