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

    <div className="grid gap-5 lg:h-[520px] lg:grid-cols-[1.35fr_0.65fr]">
      {/* Hero featured peptide */}
 {featuredPeptides[0] ? (
  <Link
    href={`/peptides/${featuredPeptides[0].slug}`}
    className="group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-lg"
  >
    <div className="relative h-[420px] w-full overflow-hidden rounded-[inherit] md:h-[520px] lg:h-full">
      {featuredPeptides[0].image_url ? (
        <img
          src={featuredPeptides[0].image_url}
          alt={featuredPeptides[0].name}
          className="absolute inset-0 block h-[101%] w-[101%] object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-muted)] text-sm text-[var(--color-muted)]">
          No image available
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

      <div className="absolute left-5 top-5 right-5 flex items-start justify-between gap-3">
        <div className="inline-flex rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Featured
        </div>

        {featuredPeptides[0].featured_order ? (
          <span className="rounded-full bg-blue-500/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            #{featuredPeptides[0].featured_order}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <p className="mb-2 text-sm font-medium text-white/80">
          {featuredPeptides[0].category}
        </p>

        <h3 className="max-w-3xl text-2xl font-semibold leading-tight text-white md:text-4xl">
          {featuredPeptides[0].name}
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
          {featuredPeptides[0].benefits || "No summary added yet."}
        </p>

        <div className="mt-5 inline-flex items-center text-sm font-medium text-blue-300">
          View peptide →
        </div>
      </div>
    </div>
  </Link>
) : null}


      {/* Supporting featured peptides */}
     <div className="grid self-start gap-5 lg:h-full lg:grid-rows-2">
  {featuredPeptides.slice(1, 4).map((peptide) => (
    <Link
      key={peptide.id}
      href={`/peptides/${peptide.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-lg"
    >
      <div className="relative h-[245px] w-full overflow-hidden rounded-[inherit] lg:h-full">
        {peptide.image_url ? (
          <img
            src={peptide.image_url}
            alt={peptide.name}
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-muted)] text-sm text-[var(--color-muted)]">
            No image available
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

        {/* Top badges */}
        <div className="absolute left-4 top-3 right-4 flex items-start justify-between gap-3">
          <div className="inline-flex rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Featured
          </div>

          {peptide.featured_order ? (
            <span className="rounded-full bg-blue-500/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              #{peptide.featured_order}
            </span>
          ) : null}
        </div>

        {/* Content on image */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-white/75">
            {peptide.category}
          </p>

          <h3 className="text-xl font-semibold leading-tight text-white">
            {peptide.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/85">
            {peptide.benefits || "No summary added yet."}
          </p>

          <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-300">
            View peptide →
          </div>
        </div>
      </div>
    </Link>
  ))}
</div>
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