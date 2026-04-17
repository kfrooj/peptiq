import { NextResponse } from "next/server";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

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

  const templateRows = [
    {
      name: "Example Peptide",
      slug: "example-peptide",
      category: "Recovery",
      description: "Short reference overview shown on the peptide page.",
      benefits: "Improved recovery\nImproved sleep quality",
      reference_dose_low: "100-200 mcg",
      reference_dose_typical: "250-500 mcg",
      reference_dose_high: "500-1000 mcg",
      frequency_reference:
        "Often referenced as once daily, split dosing, or cyclical use depending on context.",
      references:
        "PubMed article title https://pubmed.ncbi.nlm.nih.gov/example",
      disclaimer:
        "Data compiled from community sources for reference only. This information does not constitute medical advice, diagnosis, or treatment guidance and should not be used as a basis for any health-related decisions.",
      image_url: "https://example.com/example-peptide.jpg",
      published: true,
      featured: false,
      featured_order: "",
      default_vial_mg: 5,
      default_mixing_volume_ml: 2,
      default_sample_size_mcg: 250,

      // Legacy compatibility columns
      typical_research_protocol: "250-500 mcg",
      duration:
        "Often referenced as once daily, split dosing, or cyclical use depending on context.",
      general_administration_rules:
        "Often referenced as once daily, split dosing, or cyclical use depending on context.",
      common_sides_regulatory: "",
      most_popular_stacks: "",
    },
  ];

  const csv = Papa.unparse(templateRows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="peptiq-peptide-import-template.csv"',
    },
  });
}