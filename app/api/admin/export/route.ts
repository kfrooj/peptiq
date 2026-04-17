import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

type ExportRow = {
  name: string | null;
  slug: string | null;
  category: string | null;
  description: string | null;
  benefits: string | null;
  reference_dose_low: string | null;
  reference_dose_typical: string | null;
  reference_dose_high: string | null;
  frequency_reference: string | null;
  references: string | null;
  disclaimer: string | null;
  image_url: string | null;
  published: boolean | null;
  featured: boolean | null;
  featured_order: number | null;
  default_vial_mg: number | null;
  default_mixing_volume_ml: number | null;
  default_sample_size_mcg: number | null;

  // Legacy compatibility fields
  typical_research_protocol: string | null;
  duration: string | null;
  general_administration_rules: string | null;
  common_sides_regulatory: string | null;
  most_popular_stacks: string | null;
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return new NextResponse(profileError.message, { status: 500 });
  }

  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data, error } = await supabase
    .from("peptides")
    .select(
      `
        name,
        slug,
        category,
        description,
        benefits,
        reference_dose_low,
        reference_dose_typical,
        reference_dose_high,
        frequency_reference,
        references,
        disclaimer,
        image_url,
        published,
        featured,
        featured_order,
        default_vial_mg,
        default_mixing_volume_ml,
        default_sample_size_mcg,
        typical_research_protocol,
        duration,
        general_administration_rules,
        common_sides_regulatory,
        most_popular_stacks
      `
    )
    .order("name", { ascending: true });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const rows: ExportRow[] = (data ?? []) as ExportRow[];

  const normalizedRows = rows.map((row) => ({
    name: row.name ?? "",
    slug: row.slug ?? "",
    category: row.category ?? "",
    description: row.description ?? "",
    benefits: row.benefits ?? "",
    reference_dose_low: row.reference_dose_low ?? "",
    reference_dose_typical: row.reference_dose_typical ?? "",
    reference_dose_high: row.reference_dose_high ?? "",
    frequency_reference: row.frequency_reference ?? "",
    references: row.references ?? "",
    disclaimer: row.disclaimer ?? "",
    image_url: row.image_url ?? "",
    published: row.published ?? false,
    featured: row.featured ?? false,
    featured_order: row.featured_order ?? "",
    default_vial_mg: row.default_vial_mg ?? "",
    default_mixing_volume_ml: row.default_mixing_volume_ml ?? "",
    default_sample_size_mcg: row.default_sample_size_mcg ?? "",

    // Legacy compatibility columns remain in export
    typical_research_protocol: row.typical_research_protocol ?? "",
    duration: row.duration ?? "",
    general_administration_rules: row.general_administration_rules ?? "",
    common_sides_regulatory: row.common_sides_regulatory ?? "",
    most_popular_stacks: row.most_popular_stacks ?? "",
  }));

  const csv = Papa.unparse(normalizedRows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="peptiq-peptides.csv"',
    },
  });
}