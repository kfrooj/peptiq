import PeptideCalculator from "@/components/PeptideCalculator";

export default function CalculatorPage() {
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
      </section>

      <PeptideCalculator />

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