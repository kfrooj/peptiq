import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getErrorCode(message?: string) {
  const lower = (message || "").toLowerCase();

  if (lower.includes("email")) {
    return "invalid-email";
  }

  if (lower.includes("redirect")) {
    return "invalid-redirect";
  }

  return "send-failed";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();

  const rawEmail = formData.get("email");
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email) {
    redirect("/forgot-password?error=missing-email");
  }

  const requestOrigin = new URL(request.url).origin;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;

  const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    // 🔥 FULL DEBUG LOG
    console.error("resetPasswordForEmail error:", {
      message: error.message,
      name: error.name,
      status: (error as any)?.status,
      redirectTo,
      email,
    });

    const errorCode = getErrorCode(error.message);

    // ⚠️ For DEV ONLY: include message in URL so we can see it
    const debugMessage =
      process.env.NODE_ENV === "development"
        ? `&debug=${encodeURIComponent(error.message)}`
        : "";

    redirect(`/forgot-password?error=${errorCode}${debugMessage}`);
  }

  redirect("/forgot-password?success=check-email");
}