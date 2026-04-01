"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    benefits?: string;
    typical_research_protocol?: string;
    duration?: string;
    common_sides_regulatory?: string;
    most_popular_stacks?: string;
    general_administration_rules?: string;
    references?: string;
    disclaimer?: string;
    published?: boolean;
  };
};

export default function AdminPeptideForm({ peptide }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(peptide?.name ?? "");
  const [slug, setSlug] = useState(peptide?.slug ?? "");
  const [category, setCategory] = useState(peptide?.category ?? "");
  const [benefits, setBenefits] = useState(peptide?.benefits ?? "");
  const [typicalResearchProtocol, setTypicalResearchProtocol] = useState(
    peptide?.typical_research_protocol ?? ""
  );
  const [duration, setDuration] = useState(peptide?.duration ?? "");
  const [commonSidesRegulatory, setCommonSidesRegulatory] = useState(
    peptide?.common_sides_regulatory ?? ""
  );
  const [mostPopularStacks, setMostPopularStacks] = useState(
    peptide?.most_popular_stacks ?? ""
  );
  const [generalAdministrationRules, setGeneralAdministrationRules] = useState(
    peptide?.general_administration_rules ?? ""
  );
  const [references, setReferences] = useState(
  peptide?.references ?? ""
);
  const [disclaimer, setDisclaimer] = useState(
    peptide?.disclaimer ??
      "For research purposes only. Not medical advice. Not for human consumption."
  );
  const [published, setPublished] = useState(peptide?.published ?? true);
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
      benefits,
      typical_research_protocol: typicalResearchProtocol,
      duration,
      common_sides_regulatory: commonSidesRegulatory,
      most_popular_stacks: mostPopularStacks,
      general_administration_rules: generalAdministrationRules,
      references,
      disclaimer,
      published,
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
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Peptide name">
          <input
            className="w-full rounded-md border px-3 py-2"
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
            className="w-full rounded-md border px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
          />
        </Field>
      </div>

      <Field label="Category">
        <input
          className="w-full rounded-md border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </Field>

      <TextArea label="Benefits" value={benefits} onChange={setBenefits} />
      <TextArea
        label="Typical research protocol"
        value={typicalResearchProtocol}
        onChange={setTypicalResearchProtocol}
      />
      <TextArea label="Duration" value={duration} onChange={setDuration} />
      <TextArea
        label="Common sides / regulatory"
        value={commonSidesRegulatory}
        onChange={setCommonSidesRegulatory}
      />
      <TextArea
        label="Most popular stacks"
        value={mostPopularStacks}
        onChange={setMostPopularStacks}
      />
      <TextArea
        label="General administration rules"
        value={generalAdministrationRules}
        onChange={setGeneralAdministrationRules}
      />
      <TextArea
  label="References / Sources"
  value={references}
  onChange={setReferences}
/>
      <TextArea label="Disclaimer" value={disclaimer} onChange={setDisclaimer} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published
      </label>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-white shadow-sm transition hover:opacity-90">
  Save peptide
</button>
    </form>
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
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}