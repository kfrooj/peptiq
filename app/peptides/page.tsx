import { createClient } from "@/lib/supabase/server";
import PeptideSearchList from "@/components/PeptideSearchList";

export default async function PeptidesPage() {
  const supabase = await createClient();

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