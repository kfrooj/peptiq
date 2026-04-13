import AdminPeptideForm from "@/components/AdminPeptideForm";

export default function NewPeptidePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create peptide</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new peptide record to the research library.
        </p>
      </div>

      <AdminPeptideForm />
    </main>
  );
}