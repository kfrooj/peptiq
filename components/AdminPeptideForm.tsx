"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageUploadField from "@/components/ImageUploadField";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Props = {
  peptide?: {
    id?: string;
    name?: string;
    slug?: string;
    category?: string;
    description?: string | null;
    benefits?: string | null;
    typical_research_protocol?: string | null;
    duration?: string | null;
    common_sides_regulatory?: string | null;
    most_popular_stacks?: string | null;
    general_administration_rules?: string | null;
    references?: string | null;
    disclaimer?: string | null;
    published?: boolean;
    featured?: boolean;
    featured_order?: number | null;
    image_url: string | null;
    default_vial_mg?: number | null;
    default_mixing_volume_ml?: number | null;
    default_sample_size_mcg?: number | null;
    reference_dose_low?: string | null;
    reference_dose_typical?: string | null;
    reference_dose_high?: string | null;
    frequency_reference?: string | null;
  };
};

export default function AdminPeptideForm({ peptide }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(peptide?.name ?? "");
  const [slug, setSlug] = useState(peptide?.slug ?? "");
  const [category, setCategory] = useState(peptide?.category ?? "");
  const [description, setDescription] = useState(peptide?.description ?? "");

  const [reportedEffects, setReportedEffects] = useState(
    peptide?.benefits ?? ""
  );

  const [referenceDoseLow, setReferenceDoseLow] = useState(
    peptide?.reference_dose_low ?? ""
  );
  const [referenceDoseTypical, setReferenceDoseTypical] = useState(
    peptide?.reference_dose_typical ??
      peptide?.typical_research_protocol ??
      ""
  );
  const [referenceDoseHigh, setReferenceDoseHigh] = useState(
    peptide?.reference_dose_high ?? ""
  );

  const [frequencyReference, setFrequencyReference] = useState(
    peptide?.frequency_reference ??
      peptide?.general_administration_rules ??
      peptide?.duration ??
      ""
  );

  const [references, setReferences] = useState(peptide?.references ?? "");

  const [disclaimer, setDisclaimer] = useState(
    peptide?.disclaimer ??
      "Data compiled from community sources for reference only. This information does not constitute medical advice, diagnosis, or treatment guidance and should not be used as a basis for any health-related decisions."
  );

  const [published, setPublished] = useState(peptide?.published ?? true);
  const [featured, setFeatured] = useState(peptide?.featured ?? false);
  const [featuredOrder, setFeaturedOrder] = useState(
    peptide?.featured_order?.toString() ?? ""
  );

  const [imageUrl, setImageUrl] = useState(peptide?.image_url ?? "");

  const [defaultVialMg, setDefaultVialMg] = useState(
    peptide?.default_vial_mg?.toString() ?? ""
  );
  const [defaultMixingVolumeMl, setDefaultMixingVolumeMl] = useState(
    peptide?.default_mixing_volume_ml?.toString() ?? ""
  );
  const [defaultSampleSizeMcg, setDefaultSampleSizeMcg] = useState(
    peptide?.default_sample_size_mcg?.toString() ?? ""
  );

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      category,
      description,
      benefits: reportedEffects,

      // New slug-page-aligned fields
      reference_dose_low: referenceDoseLow || null,
      reference_dose_typical: referenceDoseTypical || null,
      reference_dose_high: referenceDoseHigh || null,
      frequency_reference: frequencyReference || null,

      // Keep legacy fields populated too for compatibility
      typical_research_protocol: referenceDoseTypical || null,
      duration: frequencyReference || null,
      general_administration_rules: frequencyReference || null,

      // Keep older optional content fields intact but blank if unused
      common_sides_regulatory: peptide?.common_sides_regulatory ?? null,
      most_popular_stacks: peptide?.most_popular_stacks ?? null,

      references,
      disclaimer,
      published,
      featured,
      featured_order: featuredOrder ? Number(featuredOrder) : null,
      image_url: imageUrl || null,
      default_vial_mg: defaultVialMg ? Number(defaultVialMg) : null,
      default_mixing_volume_ml: defaultMixingVolumeMl
        ? Number(defaultMixingVolumeMl)
        : null,
      default_sample_size_mcg: defaultSampleSizeMcg
        ? Number(defaultSampleSizeMcg)
        : null,
    };

    const query = peptide?.id
      ? supabase.from("peptides").update(payload).eq("id", peptide.id)
      : supabase.from("peptides").insert(payload);

    const { error } = await query;

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(peptide?.id ? "Peptide updated." : "Peptide created.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Section
        title="Description"
        note="Reference information only, not medical advice."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Peptide name">
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>

          <Field label="Slug">
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <Field label="Category">
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </Field>

          <TextArea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Short reference overview shown on the public peptide page."
          />
        </div>
      </Section>

      <Section
        title="Reported Effects"
        note="Community sourced data, not verified claims."
      >
        <TextArea
          label="Reported effects"
          value={reportedEffects}
          onChange={setReportedEffects}
          placeholder={"One effect per line\nImproved recovery\nImproved sleep quality"}
        />
      </Section>

      <Section
        title="Reference Dosage Ranges"
        note="Community-referenced data, not recommendations."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextArea
            label="Low"
            value={referenceDoseLow}
            onChange={setReferenceDoseLow}
            placeholder="Example: 100-200 mcg"
          />
          <TextArea
            label="Typical"
            value={referenceDoseTypical}
            onChange={setReferenceDoseTypical}
            placeholder="Example: 250-500 mcg"
          />
          <TextArea
            label="High"
            value={referenceDoseHigh}
            onChange={setReferenceDoseHigh}
            placeholder="Example: 500-1000 mcg"
          />
        </div>
      </Section>

      <Section title="Frequency Reference">
        <TextArea
          label="Frequency reference"
          value={frequencyReference}
          onChange={setFrequencyReference}
          placeholder="Example: Often referenced as once daily, split dosing, or cyclical use depending on context."
        />
      </Section>

      <Section
        title="Published Research"
        note="Peer-reviewed publications on PubMed. Add one reference or URL per line."
      >
        <TextArea
          label="References / sources"
          value={references}
          onChange={setReferences}
          placeholder={
            "PubMed article title https://pubmed.ncbi.nlm.nih.gov/...\nAnother publication https://..."
          }
        />
      </Section>

      <Section title="Reference Information">
        <TextArea
          label="Reference disclaimer"
          value={disclaimer}
          onChange={setDisclaimer}
          placeholder="Reference-only disclaimer shown at the bottom of the peptide page."
        />
      </Section>

      <Section title="Calculator Defaults">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Default vial amount (mg)">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full rounded-xl border px-3 py-2.5"
              value={defaultVialMg}
              onChange={(e) => setDefaultVialMg(e.target.value)}
              placeholder="5"
            />
          </Field>

          <Field label="Default mixing volume (mL)">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full rounded-xl border px-3 py-2.5"
              value={defaultMixingVolumeMl}
              onChange={(e) => setDefaultMixingVolumeMl(e.target.value)}
              placeholder="2"
            />
          </Field>

          <Field label="Default sample size (mcg)">
            <input
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border px-3 py-2.5"
              value={defaultSampleSizeMcg}
              onChange={(e) => setDefaultSampleSizeMcg(e.target.value)}
              placeholder="250"
            />
          </Field>
        </div>
      </Section>

      <Section title="Image & Display">
        <div className="grid gap-4">
          <Field label="Image URL">
            <input
              className="w-full rounded-xl border px-3 py-2.5"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/peptide-image.jpg"
            />
          </Field>

          <ImageUploadField
            value={imageUrl}
            onChange={setImageUrl}
            slug={slug || slugify(name)}
          />
        </div>
      </Section>

      <Section title="Admin Controls">
        <div className="grid gap-4 md:grid-cols-[auto_auto_180px] md:items-end">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured on homepage
          </label>

          <Field label="Featured order">
            <input
              type="number"
              min="1"
              className="w-full rounded-xl border px-3 py-2.5"
              value={featuredOrder}
              onChange={(e) => setFeaturedOrder(e.target.value)}
              placeholder="1"
            />
          </Field>
        </div>
      </Section>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex justify-start">
        <button className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
          Save peptide
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h3>
        {note ? (
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            {note}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label}
      </span>
      <textarea
        className="min-h-28 w-full rounded-xl border px-3 py-2.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}