import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPeptideForm from "@/components/AdminPeptideForm";
import DeletePeptideButton from "@/components/DeletePeptideButton";
import { createClient } from "@/lib/supabase/server";

export default async function EditPeptidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: peptide, error } = await supabase
    .from("peptides")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!peptide) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/peptides"
          className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
        >
          ← Back to peptide library
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">
          Admin editor for reference information only. Public-facing peptide
          content should remain educational and non-medical in tone.
        </p>
      </div>

      <section className="mb-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
          <div className="min-w-0">
            <p className="mb-3 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {peptide.category || "Uncategorized"}
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Edit peptide
            </h1>

            <p className="mt-2 text-lg font-medium text-[var(--color-text)]">
              {peptide.name}
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              Update the structured content used on the public peptide detail
              page, including description, reported effects, dosage reference,
              frequency reference, published research, calculator defaults, and
              visibility settings.
            </p>
          </div>

          <aside className="rounded-2xl border bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Record Status
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    peptide.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {peptide.published ? "Published" : "Draft / Hidden"}
                </span>

                {peptide.slug ? (
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Slug: {peptide.slug}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Quick Links
              </p>

              <div className="mt-4 grid gap-3">
                {peptide.slug ? (
                  <Link
                    href={`/peptides/${peptide.slug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                  >
                    View public page
                  </Link>
                ) : null}

                <Link
                  href={`/calculator?peptide=${encodeURIComponent(
                    peptide.name
                  )}&vialMg=${peptide.default_vial_mg ?? ""}&mixMl=${
                    peptide.default_mixing_volume_ml ?? ""
                  }&sampleMcg=${peptide.default_sample_size_mcg ?? ""}`}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                >
                  Open in calculator
                </Link>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Danger Zone
              </p>
              <div className="mt-4">
                <DeletePeptideButton peptideId={peptide.id} peptideName={peptide.name} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Peptide Content Editor
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            This form should mirror the public peptide page structure so each
            section is easy to create and maintain.
          </p>
        </div>

        <AdminPeptideForm peptide={peptide} />
      </section>
    </main>
  );
}