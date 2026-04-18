import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type ProfileRow = {
  role: string | null;
};

type AuthUserRow = {
  id: string;
  email?: string | null;
};

function toErrorRedirect(message: string) {
  return `/admin/reset-password?error=${encodeURIComponent(message)}`;
}

export async function POST(request: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    redirect(toErrorRedirect("Could not verify admin access."));
  }

  const profileData = profile as ProfileRow | null;

  if (profileData?.role !== "admin") {
    redirect("/dashboard");
  }

  const formData = await request.formData();
  const rawEmail = formData.get("email");
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email) {
    redirect(toErrorRedirect("Email is required."));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (!supabaseUrl || !serviceRoleKey) {
    redirect(toErrorRedirect("Missing Supabase admin environment variables."));
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: usersData, error: listError } = await admin.auth.admin.listUsers();

  if (listError) {
    redirect(toErrorRedirect("Could not load users."));
  }

  const match = (usersData.users as AuthUserRow[]).find(
    (candidate) => candidate.email?.toLowerCase() === email
  );

  if (!match) {
    redirect(toErrorRedirect("No user found for that email."));
  }

  const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (resetError) {
    redirect(toErrorRedirect("Could not send a password reset email."));
  }

  redirect(
    `/admin/reset-password?success=${encodeURIComponent(
      `Password reset email sent to ${email}`
    )}`
  );
}