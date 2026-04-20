import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function getSafeNext(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/dashboard";
  }

  return next;
}

async function handleAuthCallback(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  const supabase = await createClient();

  // PKCE / email confirmation flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback exchangeCodeForSession error:", error);

      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", requestUrl.origin)
      );
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // Email OTP / recovery / confirmation flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error) {
      console.error("Auth callback verifyOtp error:", {
        type,
        error,
      });

      const destination =
        type === "recovery"
          ? "/forgot-password?error=send-failed"
          : "/login?error=auth_callback_failed";

      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(
    new URL("/login?error=missing_auth_code", requestUrl.origin)
  );
}

export async function GET(request: Request) {
  return handleAuthCallback(request);
}

export async function POST(request: Request) {
  return handleAuthCallback(request);
}