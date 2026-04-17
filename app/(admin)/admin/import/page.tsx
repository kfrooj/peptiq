import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CsvImportForm from "@/components/CsvImportForm";

type ProfileRow = {
  role: string | null;
};

export default async function AdminImportPage() {
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-text)]">
            Import peptides
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Upload a CSV file to create or update peptide records using the
            latest schema.
          </p>
        </div>

        <Link
          href="/admin/peptides"
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          Back to peptides
        </Link>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <CsvImportForm />
      </section>
    </main>
  );
}