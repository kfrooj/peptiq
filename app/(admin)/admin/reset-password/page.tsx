import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  role: string | null;
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createClient();

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
    throw new Error(profileError.message);
  }

  const profileData = profile as ProfileRow | null;

  if (profileData?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const success = params?.success ? decodeURIComponent(params.success) : "";
  const error = params?.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">
            Admin
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            Password Reset Tool
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Reset a user password directly for testing and support.
          </p>
        </div>

        <Link
          href="/admin/peptides"
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          Back to Admin Hub
        </Link>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
          Reset User Password
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Enter the user’s email address and a new password.
        </p>

        <form
          action="/admin/reset-password/submit"
          method="post"
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              User email
            </span>
            <input
              type="email"
              name="email"
              required
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
              placeholder="user@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              New password
            </span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
              placeholder="Minimum 8 characters"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          ) : null}

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Reset Password
          </button>
        </form>
      </section>
    </main>
  );
}