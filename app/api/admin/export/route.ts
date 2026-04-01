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

  const { data, error } = await supabase
    .from("peptides")
    .select(
      `
      name,
      slug,
      category,
      benefits,
      typical_research_protocol,
      duration,
      common_sides_regulatory,
      most_popular_stacks,
      general_administration_rules,
      references,
      disclaimer,
      published
    `
    )
    .order("name", { ascending: true });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const csv = Papa.unparse(data ?? []);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="peptiq-peptides.csv"',
    },
  });
}