import CsvImportForm from "@/components/CsvImportForm";

export default function AdminImportPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Import peptides from CSV</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload a CSV file to create or update peptide records by slug.
        </p>
      </div>

      <CsvImportForm />
    </main>
  );
}