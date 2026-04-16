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
    data
      ?.filter((p) => p.slug && p.name)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category?.trim() || "Uncategorized",
      })) ?? [];

  return (
    <main className="bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <PeptideSearchList peptides={peptides} />
      </section>
    </main>
  );
}