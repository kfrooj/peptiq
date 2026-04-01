import { createClient } from "@/lib/supabase/server";
import { Peptide } from "@/types/peptide";

export async function getPublishedPeptides(): Promise<Peptide[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("peptides")
    .select("*")
    .eq("published", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPeptideBySlug(slug: string): Promise<Peptide | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("peptides")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}