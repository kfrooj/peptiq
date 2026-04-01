import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ImportRow = {
  name: string;
  slug: string;
  category: string;
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

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rows = (body.rows ?? []) as ImportRow[];

  if (!Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "No CSV rows found." }, { status: 400 });
  }

  const cleanedRows = rows
    .filter((row) => row.name && row.slug && row.category)
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      category: row.category,
      benefits: row.benefits || null,
      typical_research_protocol: row.typical_research_protocol || null,
      duration: row.duration || null,
      common_sides_regulatory: row.common_sides_regulatory || null,
      most_popular_stacks: row.most_popular_stacks || null,
      general_administration_rules: row.general_administration_rules || null,
      references: row.references || null,
      disclaimer:
        row.disclaimer ||
        "For research purposes only. Not medical advice. Not for human consumption.",
      published: row.published ?? true,
    }));

  const { error } = await supabase
    .from("peptides")
    .upsert(cleanedRows, { onConflict: "slug" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Imported ${cleanedRows.length} peptide row(s).`,
  });
}