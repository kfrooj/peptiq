import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PeptideFavoriteStarButton from "@/components/PeptideFavoriteStarButton";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type PeptideRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  benefits: string | null;
  reference_dose_low: string | null;
  reference_dose_typical: string | null;
  reference_dose_high: string | null;
  frequency_reference: string | null;
  references: string | null;
  default_vial_mg: number | null;
  default_mixing_volume_ml: number | null;
  default_sample_size_mcg: number | null;
  typical_research_protocol: string | null;
  duration: string | null;
  general_administration_rules: string | null;
  published: boolean | null;
};

export default async function PeptideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: peptide, error } = await supabase
    .from("peptides")
    .select(
      `
        id,
        slug,
        name,
        category,
        description,
        benefits,
        reference_dose_low,
        reference_dose_typical,
        reference_dose_high,
        frequency_reference,
        references,
        default_vial_mg,
        default_mixing_volume_ml,
        default_sample_size_mcg,
        typical_research_protocol,
        duration,
        general_administration_rules,
        published
      `
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!peptide) {
    notFound();
  }

  const typedPeptide = peptide as PeptideRow;

  const description =
    getOptionalField(typedPeptide, [
      "description",
      "summary",
      "short_description",
      "overview",
    ]) || "Structured reference information for educational browsing only.";

  const reportedEffects = toBulletList(typedPeptide.benefits);

  const lowDose =
    getOptionalField(typedPeptide, [
      "reference_dose_low",
      "low_dose",
      "dose_low",
      "dosage_low",
    ]) || "Not added yet.";

  const typicalDose =
    getOptionalField(typedPeptide, [
      "reference_dose_typical",
      "typical_dose",
      "dose_typical",
      "dosage_typical",
      "typical_research_protocol",
    ]) || "Not added yet.";

  const highDose =
    getOptionalField(typedPeptide, [
      "reference_dose_high",
      "high_dose",
      "dose_high",
      "dosage_high",
    ]) || "Not added yet.";

  const frequencyReference =
    getOptionalField(typedPeptide, [
      "frequency_reference",
      "frequency",
      "duration",
      "general_administration_rules",
      "typical_research_protocol",
    ]) || "No information added yet.";

  const researchLinks = parseReferenceLinks(typedPeptide.references);

  const categoryLabel = typedPeptide.category?.trim() || "Peptide";
  const hasCalculatorDefaults =
    typedPeptide.default_vial_mg ||
    typedPeptide.default_mixing_volume_ml ||
    typedPeptide.default_sample_size_mcg;

  return (
    <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-8">
      <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Reference information only. Not medical advice or intended for human use.
        </p>
      </div>

      <section className="mb-5 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-start md:gap-6 md:p-8">
          <div className="min-w-0">
            <p className="mb-3 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {categoryLabel}
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              {typedPeptide.name}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {description}
            </p>

            {(hasCalculatorDefaults || typedPeptide.frequency_reference) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {typedPeptide.default_vial_mg ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Vial {typedPeptide.default_vial_mg} mg
                  </span>
                ) : null}
                {typedPeptide.default_mixing_volume_ml ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Mix {typedPeptide.default_mixing_volume_ml} mL
                  </span>
                ) : null}
                {typedPeptide.default_sample_size_mcg ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Sample {typedPeptide.default_sample_size_mcg} mcg
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Actions
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Save to favorites
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Keep this peptide handy.
                </p>
              </div>

              <div className="shrink-0">
                <PeptideFavoriteStarButton peptideId={typedPeptide.id} />
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Open in calculator
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Pre-fill calculator defaults for faster use.
              </p>

              <Link
                href={`/calculator?peptide=${encodeURIComponent(
                  typedPeptide.name
                )}&vialMg=${typedPeptide.default_vial_mg ?? ""}&mixMl=${
                  typedPeptide.default_mixing_volume_ml ?? ""
                }&sampleMcg=${typedPeptide.default_sample_size_mcg ?? ""}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Open calculator
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-4">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <SectionHeader
            title="Reference Dosage Ranges"
            description="Reference values gathered from community sources."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <DosageTile label="Low" value={lowDose} />
            <DosageTile label="Typical" value={typicalDose} />
            <DosageTile label="High" value={highDose} />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <SectionHeader
            title="Reported Effects"
            description="Community-referenced observations, not verified claims."
          />

          {reportedEffects.length ? (
            <ul className="mt-4 space-y-2">
              {reportedEffects.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-7 text-[var(--color-text)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              No information added yet.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <SectionHeader
            title="Frequency Reference"
            description="Typical community-referenced timing and usage notes."
          />

          <div className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">
              {frequencyReference}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <SectionHeader
            title="Published Research"
            description="Linked publications and source material."
          />

          {researchLinks.length ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {researchLinks.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              No published research links added yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function DosageTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function getOptionalField(peptide: unknown, keys: string[]): string | null {
  const record = peptide as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function toBulletList(content: string | null): string[] {
  if (!content) return [];

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((line) => line.replace(/^[-•*○]\s?/, "").trim());
  }

  return content
    .split(/[\n•;○-]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^[-•*○]\s?/, "").trim());
}

function parseReferenceLinks(content: string | null): Array<{
  label: string;
  url: string;
}> {
  if (!content) return [];

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const urlMatch = line.match(/https?:\/\/\S+/);
      if (!urlMatch) return null;

      const url = urlMatch[0];
      const rawLabel = line.replace(url, "").trim();

      let label = rawLabel;

      if (!label) {
        try {
          const parsed = new URL(url);
          label =
            parsed.hostname.includes("pubmed") ||
            parsed.hostname.includes("ncbi.nlm.nih.gov")
              ? "Open PubMed article"
              : "Open source";
        } catch {
          label = "Open source";
        }
      }

      return { label, url };
    })
    .filter((item): item is { label: string; url: string } => Boolean(item));
}