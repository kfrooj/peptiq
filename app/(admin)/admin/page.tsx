import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  role: string | null;
};

export default async function AdminHubPage() {
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
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const currentProfile = profile as ProfileRow | null;

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const [
    { count: peptideCount, error: peptideCountError },
    { count: publishedPeptideCount, error: publishedCountError },
  ] = await Promise.all([
    supabase.from("peptides").select("*", { count: "exact", head: true }),
    supabase
      .from("peptides")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
  ]);

  if (peptideCountError) {
    throw new Error(peptideCountError.message);
  }

  if (publishedCountError) {
    throw new Error(publishedCountError.message);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-[var(--color-accent)]">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--color-text)]">
          Admin Hub
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Internal tools for managing users, peptide content, and support workflows.
        </p>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total peptides"
          value={String(peptideCount ?? 0)}
        />
        <StatCard
          label="Published peptides"
          value={String(publishedPeptideCount ?? 0)}
        />
        <StatCard
          label="Draft peptides"
          value={String(
            Math.max(0, (peptideCount ?? 0) - (publishedPeptideCount ?? 0))
          )}
        />
        <StatCard
          label="Admin access"
          value="Enabled"
        />
      </section>

      <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            User Tools
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Support actions for account lookup and admin troubleshooting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            href="/admin/users"
            title="User Lookup"
            description="Search for a user by email and review their auth and app profile details."
          />

          <AdminCard
            href="/admin/reset-password"
            title="Reset User Password"
            description="Manually reset a user password for testing or support."
          />

          <PlaceholderCard
            title="Account Actions"
            description="Reserved for future tools like role updates, access flags, subscription controls, and activity review."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Peptide Library
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Manage peptide content, calculator defaults, publishing, and CSV workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            href="/admin/peptides"
            title="Manage Peptides"
            description="Search, filter, edit, and review peptide library entries."
          />

          <AdminCard
            href="/admin/import"
            title="Import CSV"
            description="Upload peptide data in bulk and sync it with the current library structure."
          />

          <AdminCard
            href="/api/admin/export"
            title="Export CSV"
            description="Download the current peptide library data for backup, review, or bulk editing."
          />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function AdminCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <h3 className="text-base font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
      <div className="mt-3 text-sm font-medium text-[var(--color-accent)]">
        Open →
      </div>
    </Link>
  );
}

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-4">
      <h3 className="text-base font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
      <div className="mt-3 text-sm font-medium text-[var(--color-muted)]">
        Coming soon
      </div>
    </div>
  );
}