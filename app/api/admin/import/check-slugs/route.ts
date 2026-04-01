import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slugs = Array.isArray(body.slugs) ? body.slugs : [];

  if (!slugs.length) {
    return NextResponse.json({ existingSlugs: [] });
  }

  const { data, error } = await supabase
    .from("peptides")
    .select("slug")
    .in("slug", slugs);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    existingSlugs: (data ?? []).map((row) => row.slug),
  });
}