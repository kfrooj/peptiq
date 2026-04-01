import { getPublishedPeptides } from "@/lib/peptides";
import PeptideSearchList from "@/components/PeptideSearchList";

export default async function HomePage() {
  const peptides = await getPublishedPeptides();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-10 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="grid gap-8 p-8 md:grid-cols-[1.3fr_0.7fr] md:p-10">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              Research use only
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
              Peptide research information, organized clearly
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Explore structured peptide summaries, usage notes, and
              references in one place. Built for fast browsing and simpler
              research review.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              At a glance
            </h2>

            <div className="mt-4 grid gap-4">
              <Stat label="Published peptides" value={String(peptides.length)} />
              <Stat label="Search and filters" value="Included" />
              <Stat label="References" value="Supported" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <PeptideSearchList peptides={peptides} />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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