import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handleAuthCallback(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_auth_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", requestUrl.origin)
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

// ✅ Support BOTH methods
export async function GET(request: Request) {
  return handleAuthCallback(request);
}

export async function POST(request: Request) {
  return handleAuthCallback(request);
}