import { notFound } from "next/navigation";
import Link from "next/link";
import { getPeptideBySlug } from "@/lib/peptides";
import PeptideFavoriteStarButton from "@/components/PeptideFavoriteStarButton";

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const peptide = await getPeptideBySlug(slug);

  if (!peptide) {
    notFound();
  }

  const description =
    getOptionalField(peptide, [
      "description",
      "summary",
      "short_description",
      "overview",
    ]) || "Structured reference information for educational browsing only.";

  const reportedEffects = toBulletList(peptide.benefits);

  const lowDose =
    getOptionalField(peptide, [
      "reference_dose_low",
      "low_dose",
      "dose_low",
      "dosage_low",
    ]) || "Not added yet.";

  const typicalDose =
    getOptionalField(peptide, [
      "reference_dose_typical",
      "typical_dose",
      "dose_typical",
      "dosage_typical",
      "typical_research_protocol",
    ]) || "Not added yet.";

  const highDose =
    getOptionalField(peptide, [
      "reference_dose_high",
      "high_dose",
      "dose_high",
      "dosage_high",
    ]) || "Not added yet.";

  const frequencyReference =
    getOptionalField(peptide, [
      "frequency_reference",
      "frequency",
      "duration",
      "general_administration_rules",
      "typical_research_protocol",
    ]) || "No information added yet.";

  const researchLinks = parseReferenceLinks(peptide.references);

  const categoryLabel = peptide.category?.trim() || "Peptide";
  const hasCalculatorDefaults =
    peptide.default_vial_mg ||
    peptide.default_mixing_volume_ml ||
    peptide.default_sample_size_mcg;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <p className="text-sm font-medium text-[var(--color-text)]">
          Reference information only. Not medical advice or intended for human use.
        </p>
      </div>

      <section className="mb-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
          <div className="min-w-0">
            <p className="mb-3 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {categoryLabel}
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              {peptide.name}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {description}
            </p>

            {hasCalculatorDefaults ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {peptide.default_vial_mg ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Default vial: {peptide.default_vial_mg} mg
                  </span>
                ) : null}
                {peptide.default_mixing_volume_ml ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Default mix: {peptide.default_mixing_volume_ml} mL
                  </span>
                ) : null}
                {peptide.default_sample_size_mcg ? (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                    Default sample: {peptide.default_sample_size_mcg} mcg
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Actions
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Save to favorites
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Add this peptide for quick access later.
                </p>
              </div>

              <div className="shrink-0">
                <PeptideFavoriteStarButton peptideId={peptide.id} />
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Open in calculator
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Pre-fill the calculator using this peptide’s defaults.
              </p>

              <Link
                href={`/calculator?peptide=${encodeURIComponent(
                  peptide.name
                )}&vialMg=${peptide.default_vial_mg ?? ""}&mixMl=${
                  peptide.default_mixing_volume_ml ?? ""
                }&sampleMcg=${peptide.default_sample_size_mcg ?? ""}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Open calculator
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-5">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            Reported Effects
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Community-referenced observations, not verified claims.
          </p>

          {reportedEffects.length ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--color-text)]">
              {reportedEffects.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              No information added yet.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            Reference Dosage Ranges
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Reference values gathered from community sources.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <DosageTile label="Low" value={lowDose} />
            <DosageTile label="Typical" value={typicalDose} />
            <DosageTile label="High" value={highDose} />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            Frequency Reference
          </h2>

          <div className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">
              {frequencyReference}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            Published Research
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Linked publications and source material.
          </p>

          {researchLinks.length ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {researchLinks.map((item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
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

function DosageTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
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
    return lines.map((line) => line.replace(/^[-•*]\s?/, "").trim());
  }

  return content
    .split(/[\n•;-]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^[-•*]\s?/, "").trim());
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