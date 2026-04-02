import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import PeptideFavoriteStarButton from "@/components/PeptideFavoriteStarButton";

export default async function AdminPeptidesPage() {
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

  if (profile?.role !== "admin") {
    redirect("/");
  }

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

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/api/admin/export"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
          >
            Export CSV
          </Link>

          <Link
            href="/admin/import"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
          >
            Import CSV
          </Link>

          <Link
            href="/admin/peptides/new"
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Add peptide
          </Link>

          <div className="flex-1" />

          <AdminLogoutButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-semibold">Favorite</th>
              <th className="px-4 py-3 text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-sm font-semibold">Category</th>
              <th className="px-4 py-3 text-sm font-semibold">
                Calculator defaults
              </th>
              <th className="px-4 py-3 text-sm font-semibold">Published</th>
              <th className="px-4 py-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {peptides?.map((peptide) => (
              <tr key={peptide.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-sm">
                  <PeptideFavoriteStarButton peptideId={peptide.id} />
                </td>

                <td className="px-4 py-3 text-sm font-medium">
                  {peptide.name}
                </td>

                <td className="px-4 py-3 text-sm">{peptide.category}</td>

                <td className="px-4 py-3 text-sm">
                  {peptide.default_vial_mg ||
                  peptide.default_mixing_volume_ml ||
                  peptide.default_sample_size_mcg ? (
                    <div className="flex flex-wrap gap-2">
                      {peptide.default_vial_mg ? (
                        <span
                          title="Default vial amount"
                          className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {peptide.default_vial_mg} mg
                        </span>
                      ) : null}

                      {peptide.default_mixing_volume_ml ? (
                        <span
                          title="Default mixing volume"
                          className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                        >
                          {peptide.default_mixing_volume_ml} mL
                        </span>
                      ) : null}

                      {peptide.default_sample_size_mcg ? (
                        <span
                          title="Default sample size"
                          className="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
                        >
                          {peptide.default_sample_size_mcg} mcg
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span
                      title="No calculator defaults set"
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500"
                    >
                      Not set
                    </span>
                  )}
                </td>

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
                <td colSpan={6} className="px-4 py-6 text-sm text-gray-500">
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