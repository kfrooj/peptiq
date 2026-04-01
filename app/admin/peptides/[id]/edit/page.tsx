import { notFound } from "next/navigation";
import AdminPeptideForm from "@/components/AdminPeptideForm";
import DeletePeptideButton from "@/components/DeletePeptideButton";
import { createClient } from "@/lib/supabase/server";

export default async function EditPeptidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: peptide, error } = await supabase
    .from("peptides")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!peptide) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit peptide</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update this peptide record.
        </p>
      </div>

      <>
  <AdminPeptideForm peptide={peptide} />
  <DeletePeptideButton peptideId={peptide.id} peptideName={peptide.name} />
</>
    </main>
  );
}