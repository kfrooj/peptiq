import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPeptideForm from "@/components/AdminPeptideForm";

type ProfileRow = {
  role: string | null;
};

type PeptideRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  benefits: string | null;
  typical_research_protocol: string | null;
  duration: string | null;
  common_sides_regulatory: string | null;
  most_popular_stacks: string | null;
  general_administration_rules: string | null;
  references: string | null;
  disclaimer: string | null;
  published: boolean | null;
  featured: boolean | null;
  featured_order: number | null;
  image_url: string | null;
  default_vial_mg: number | null;
  default_mixing_volume_ml: number | null;
  default_sample_size_mcg: number | null;
  reference_dose_low: string | null;
  reference_dose_typical: string | null;
  reference_dose_high: string | null;
  frequency_reference: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditPeptidePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const currentProfile = profile as ProfileRow | null;

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const { data: peptide, error: peptideError } = await supabase
    .from("peptides")
    .select(
      `
        id,
        name,
        slug,
        category,
        description,
        benefits,
        typical_research_protocol,
        duration,
        common_sides_regulatory,
        most_popular_stacks,
        general_administration_rules,
        references,
        disclaimer,
        published,
        featured,
        featured_order,
        image_url,
        default_vial_mg,
        default_mixing_volume_ml,
        default_sample_size_mcg,
        reference_dose_low,
        reference_dose_typical,
        reference_dose_high,
        frequency_reference
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (peptideError) {
    throw new Error(peptideError.message);
  }

  if (!peptide) {
    notFound();
  }

  const typedPeptide = peptide as PeptideRow;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-text)]">
            Edit Peptide
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Update reference content, calculator defaults, display settings, and
            publishing controls for{" "}
            <span className="font-medium text-[var(--color-text)]">
              {typedPeptide.name}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/peptides"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Back to peptides
          </Link>

          <Link
            href={`/calculator?peptide=${encodeURIComponent(
              typedPeptide.name
            )}&vialMg=${typedPeptide.default_vial_mg ?? ""}&mixMl=${
              typedPeptide.default_mixing_volume_ml ?? ""
            }&sampleMcg=${typedPeptide.default_sample_size_mcg ?? ""}`}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Open calculator
          </Link>
        </div>
      </div>

      <AdminPeptideForm peptide={typedPeptide} />
    </main>
  );
}