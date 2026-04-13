import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      accepted: false,
      version: null,
    });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("disclaimer_accepted, disclaimer_version, disclaimer_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        authenticated: true,
        accepted: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    accepted: profile?.disclaimer_accepted === true,
    version: profile?.disclaimer_version ?? null,
    acceptedAt: profile?.disclaimer_accepted_at ?? null,
  });
}