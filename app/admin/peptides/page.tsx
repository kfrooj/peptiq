import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default async function AdminPeptidesPage() {
  const supabase = await createClient();

  const { data: peptides, error } = await supabase
    .from("peptides")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
     <div className="mb-6 flex items-center justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold">Manage peptides</h1>
    <p className="mt-2 text-sm text-gray-600">
      View, add, and edit peptide records.
    </p>
  </div>

  <div className="flex items-center gap-3">
    <Link
  href="/admin/peptides/new"
  className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-white shadow-sm transition hover:opacity-90"
>
  Add peptide
</Link>
    <AdminLogoutButton />
  </div>
</div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-sm font-semibold">Category</th>
              <th className="px-4 py-3 text-sm font-semibold">Published</th>
              <th className="px-4 py-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {peptides?.map((peptide) => (
              <tr key={peptide.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-sm">{peptide.name}</td>
                <td className="px-4 py-3 text-sm">{peptide.category}</td>
                <td className="px-4 py-3 text-sm">
                  {peptide.published ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/admin/peptides/${peptide.id}/edit`}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {!peptides?.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-gray-500">
                  No peptides found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}