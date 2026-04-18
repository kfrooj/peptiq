import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getErrorCode(message?: string) {
  const lower = (message || "").toLowerCase();

  if (lower.includes("email")) {
    return "invalid-email";
  }

  return "send-failed";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();

  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email) {
    redirect("/forgot-password?error=missing-email");
  }

  const requestOrigin = new URL(request.url).origin;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    const errorCode = getErrorCode(error.message);
    redirect(`/forgot-password?error=${errorCode}`);
  }

  redirect("/forgot-password?success=check-email");
}