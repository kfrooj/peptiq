import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PeptideSearchList from "@/components/PeptideSearchList";

export default async function PeptidesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("peptides")
    .select("id, slug, name, category")
    .eq("published", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const peptides =
    data?.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category ?? "Uncategorized",
    })) ?? [];

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex items-center justify-between gap-4 md:hidden">
          <Link href="/" className="shrink-0">
            <Image
              src="/peptiq-logo.png"
              alt="PEPTIQ"
              width={180}
              height={44}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            Peptides
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Browse all available peptides and explore detailed research pages.
          </p>
        </div>

        <PeptideSearchList peptides={peptides} />
      </section>
    </main>
  );
}