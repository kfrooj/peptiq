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
    redirect(
      `/admin/reset-password?error=${encodeURIComponent(profileError.message)}`
    );
  }

  const profileData = profile as ProfileRow | null;

  if (profileData?.role !== "admin") {
    redirect("/dashboard");
  }

  const formData = await request.formData();
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  // IMPORTANT: do not trim passwords
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email) {
    redirect("/admin/reset-password?error=Email%20is%20required.");
  }

  if (password.length < 8) {
    redirect(
      "/admin/reset-password?error=Password%20must%20be%20at%20least%208%20characters."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    redirect(
      "/admin/reset-password?error=Missing%20Supabase%20admin%20environment%20variables."
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: usersData, error: listError } =
    await admin.auth.admin.listUsers();

  if (listError) {
    redirect(
      `/admin/reset-password?error=${encodeURIComponent(listError.message)}`
    );
  }

  const match = (usersData.users as AuthUserRow[]).find(
    (candidate) => candidate.email?.toLowerCase() === email
  );

  if (!match) {
    redirect(
      "/admin/reset-password?error=No%20user%20found%20for%20that%20email."
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    match.id,
    {
      password,
    }
  );

  if (updateError) {
    redirect(
      `/admin/reset-password?error=${encodeURIComponent(updateError.message)}`
    );
  }

  redirect(
    `/admin/reset-password?success=${encodeURIComponent(
      `Password updated for ${email}`
    )}`
  );
}