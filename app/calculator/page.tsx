import { Suspense } from "react";
import CalculatorPageClient from "../../components/CalculatorPageClient";

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
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
          </section>
        </main>
      }
    >
      <CalculatorPageClient />
    </Suspense>
  );
}