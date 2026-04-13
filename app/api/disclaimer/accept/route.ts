import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json().catch(() => ({}));
  const version = body?.version ?? "v1";

  if (!user) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      savedToProfile: false,
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      disclaimer_accepted: true,
      disclaimer_version: version,
      disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    savedToProfile: true,
  });
}