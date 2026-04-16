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
    <div className="mx-auto max-w-5xl">
      <section className="mb-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:mb-8 sm:p-8">
        <div className="mb-4 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          Research use only
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Peptide Reconstitution Calculator
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Calculate concentration, required volume, and syringe units for research
          preparation.
        </p>

        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-text)]">
            Reference information only. Not medical advice or intended for human use.
          </p>
        </div>

        {peptideName ? (
          <div className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Pre-filled from peptide: {peptideName}
          </div>
        ) : null}
      </section>

      <PeptideCalculator
        initialPeptideName={peptideName}
        initialVialMg={initialVialMg}
        initialMixingVolumeMl={initialMixingVolumeMl}
        initialSampleMcg={initialSampleMcg}
      />
    </div>
  );
}