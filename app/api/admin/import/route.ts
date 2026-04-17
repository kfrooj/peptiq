import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ImportRow = {
  name: string;
  slug: string;
  category: string;
  description?: string;
  benefits?: string;
  reference_dose_low?: string;
  reference_dose_typical?: string;
  reference_dose_high?: string;
  frequency_reference?: string;
  references?: string;
  disclaimer?: string;
  image_url?: string;
  published?: boolean;
  featured?: boolean;
  featured_order?: number | null;
  default_vial_mg?: number | null;
  default_mixing_volume_ml?: number | null;
  default_sample_size_mcg?: number | null;
  typical_research_protocol?: string;
  duration?: string;
  general_administration_rules?: string;
  common_sides_regulatory?: string;
  most_popular_stacks?: string;
};

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && !value.trim())
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const rows = (body.rows ?? []) as ImportRow[];
  const overwriteExisting = body.overwriteExisting ?? true;

  if (!Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "No CSV rows found." }, { status: 400 });
  }

  const cleanedRows = rows
    .filter((row) => row.name?.trim() && row.slug?.trim() && row.category?.trim())
    .map((row) => {
      const referenceDoseTypical =
        cleanText(row.reference_dose_typical) ??
        cleanText(row.typical_research_protocol);

      const frequencyReference =
        cleanText(row.frequency_reference) ??
        cleanText(row.general_administration_rules) ??
        cleanText(row.duration);

      return {
        name: row.name.trim(),
        slug: row.slug.trim(),
        category: row.category.trim(),
        description: cleanText(row.description),
        benefits: cleanText(row.benefits),
        reference_dose_low: cleanText(row.reference_dose_low),
        reference_dose_typical: referenceDoseTypical,
        reference_dose_high: cleanText(row.reference_dose_high),
        frequency_reference: frequencyReference,
        typical_research_protocol: referenceDoseTypical,
        duration: frequencyReference,
        general_administration_rules: frequencyReference,
        common_sides_regulatory: cleanText(row.common_sides_regulatory),
        most_popular_stacks: cleanText(row.most_popular_stacks),
        references: cleanText(row.references),
        disclaimer:
          cleanText(row.disclaimer) ??
          "Data compiled from community sources for reference only. This information does not constitute medical advice, diagnosis, or treatment guidance and should not be used as a basis for any health-related decisions.",
        image_url: cleanText(row.image_url),
        published: row.published ?? true,
        featured: row.featured ?? false,
        featured_order: row.featured ? cleanNumber(row.featured_order) : null,
        default_vial_mg: cleanNumber(row.default_vial_mg),
        default_mixing_volume_ml: cleanNumber(row.default_mixing_volume_ml),
        default_sample_size_mcg: cleanNumber(row.default_sample_size_mcg),
        updated_at: new Date().toISOString(),
      };
    });

  if (!cleanedRows.length) {
    return NextResponse.json(
      { error: "No valid rows found to import." },
      { status: 400 }
    );
  }

  const slugs = cleanedRows.map((row) => row.slug);

  const { data: existingRows, error: existingError } = await supabase
    .from("peptides")
    .select("*")
    .in("slug", slugs);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingBySlug = new Map(
    (existingRows ?? []).map((row) => [row.slug, row])
  );

  const updatedCount = cleanedRows.filter((row) =>
    existingBySlug.has(row.slug)
  ).length;

  const createdCount = cleanedRows.length - updatedCount;

  const finalRows = overwriteExisting
    ? cleanedRows
    : cleanedRows.map((incoming) => {
        const existing = existingBySlug.get(incoming.slug);

        if (!existing) {
          return incoming;
        }

        const merged: Record<string, unknown> = { ...existing };

        for (const [key, value] of Object.entries(incoming)) {
          if (key === "slug") {
            merged[key] = value;
            continue;
          }

          if (isBlank(merged[key])) {
            merged[key] = value;
          }
        }

        merged.updated_at = new Date().toISOString();

        return merged;
      });

  const { error } = await supabase
    .from("peptides")
    .upsert(finalRows, { onConflict: "slug" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Imported ${cleanedRows.length} peptide row(s): ${createdCount} created, ${updatedCount} updated.${
      overwriteExisting ? "" : " Existing values were preserved unless blank."
    }`,
    createdCount,
    updatedCount,
    totalCount: cleanedRows.length,
  });
}