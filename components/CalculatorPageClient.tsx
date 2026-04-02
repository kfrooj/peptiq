"use client";

import { useSearchParams } from "next/navigation";
import PeptideCalculator from "./PeptideCalculator";

export default function CalculatorPageClient() {
  const searchParams = useSearchParams();

  const peptideName = searchParams.get("peptide") ?? "";
  const initialVialMg = searchParams.get("vialMg") ?? "";
  const initialMixingVolumeMl = searchParams.get("mixMl") ?? "";
  const initialSampleMcg = searchParams.get("sampleMcg") ?? "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="mb-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-4 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          Research use only
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">
          Peptide Reconstitution Calculator
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
          Calculate concentration, required volume, and syringe units for research
          preparation. This tool is for informational and research purposes only.
        </p>

        {peptideName ? (
          <div className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Selected peptide: {peptideName}
          </div>
        ) : null}
      </section>

      <PeptideCalculator
        initialPeptideName={peptideName}
        initialVialMg={initialVialMg}
        initialMixingVolumeMl={initialMixingVolumeMl}
        initialSampleMcg={initialSampleMcg}
      />

      <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Important note
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">
          This calculator is provided for research and informational purposes only.
          It is not medical advice and is not intended for human use.
        </p>
      </section>
    </main>
  );
}