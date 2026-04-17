import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
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

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.slugs)) {
      return NextResponse.json(
        { error: "Request body must include a slugs array." },
        { status: 400 }
      );
    }

    const slugs = body.slugs
      .map((slug: unknown) =>
        typeof slug === "string" ? slug.trim() : ""
      )
      .filter(Boolean);

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
      existingSlugs: (data ?? [])
        .map((row) => row.slug)
        .filter((slug): slug is string => Boolean(slug)),
    });
  } catch (error) {
    console.error("check-slugs route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while checking slugs.",
      },
      { status: 500 }
    );
  }
}