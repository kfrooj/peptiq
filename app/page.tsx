import { getFeaturedPeptides, getPublishedPeptides } from "@/lib/peptides";
import PeptideSearchList from "@/components/PeptideSearchList";
import Link from "next/link";

export default async function HomePage() {
  const peptides = await getPublishedPeptides();
  const featuredPeptides = await getFeaturedPeptides();

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

{featuredPeptides.length ? (
  <section className="mb-10">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          Featured peptides
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Curated highlights from the library.
        </p>
      </div>
    </div>

    <div className="grid gap-5 md:grid-cols-3">
      {featuredPeptides.map((peptide) => (
        <Link
          key={peptide.id}
          href={`/peptides/${peptide.slug}`}
          className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-lg"
        >
          <div className="relative">
            {peptide.image_url ? (
              <img
                src={peptide.image_url}
                alt={peptide.name}
                className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-52 w-full items-center justify-center bg-[var(--color-surface-muted)] text-sm text-[var(--color-muted)]">
                No image available
              </div>
            )}

            <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white">
              Featured
            </div>
          </div>

          <div className="p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {peptide.name}
              </h3>

              {peptide.featured_order ? (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  #{peptide.featured_order}
                </span>
              ) : null}
            </div>

            <p className="text-sm text-[var(--color-muted)]">
              {peptide.category}
            </p>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">
              {peptide.benefits || "No summary added yet."}
            </p>

            <div className="mt-4 inline-flex items-center text-sm font-medium text-[var(--color-accent)]">
              View peptide →
            </div>
          </div>
        </Link>
      ))}
    </div>
  </section>
) : null}

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