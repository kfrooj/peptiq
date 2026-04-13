import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminPeptideFilters from "@/components/AdminPeptideFilters";


const PAGE_SIZE = 10;

type SearchParams = Promise<{
  page?: string;
  q?: string;
  category?: string;
}>;

export default async function AdminPeptidesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  const { data: categoryRows, error: categoryError } = await supabase
    .from("peptides")
    .select("category")
    .order("category", { ascending: true });

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((row) => row.category)
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );

  let countQuery = supabase
    .from("peptides")
    .select("*", { count: "exact", head: true });

  if (query) {
    countQuery = countQuery.ilike("name", `%${query}%`);
  }

  if (category) {
    countQuery = countQuery.eq("category", category);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new Error(countError.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let peptidesQuery = supabase
    .from("peptides")
    .select("*")
    .order("name", { ascending: true })
    .range(from, to);

  if (query) {
    peptidesQuery = peptidesQuery.ilike("name", `%${query}%`);
  }

  if (category) {
    peptidesQuery = peptidesQuery.eq("category", category);
  }

  const { data: peptides, error } = await peptidesQuery;

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-accent)]">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-text)]">
            Admin Hub
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Manage peptides, user tools, and future admin actions from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminLogoutButton />
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              Manage Users
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Internal-only tools for testing, support, and future account
              management.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/reset-password"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              Reset User Password
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Manually reset a user password for testing or support without using
              the forgot password flow.
            </p>
            <div className="mt-3 text-sm font-medium text-[var(--color-accent)]">
              Open →
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              User Lookup
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Search for a user by email and view basic account details for
              testing or support.
            </p>
            <div className="mt-3 text-sm font-medium text-[var(--color-accent)]">
              Open →
            </div>
          </Link>

          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-4">
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              Account Actions
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Reserve this space for future tools like role updates, access
              flags, subscription controls, or support actions.
            </p>
            <div className="mt-3 text-sm font-medium text-[var(--color-muted)]">
              Coming soon
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              Manage Peptides
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Search, filter, and open a peptide record to edit its structured
              reference content.
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
          </div>
        </div>

        <AdminPeptideFilters
          initialQuery={query}
          initialCategory={category}
          categories={categories}
        />

        <div className="mb-4 flex flex-col gap-2 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {totalCount === 0 ? 0 : from + 1}–{Math.min(to + 1, totalCount)} of{" "}
            {totalCount} peptide{totalCount === 1 ? "" : "s"}
          </p>
          <p>
            Page {safePage} of {totalPages}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                  <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                    Calculator defaults
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                    Published
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {peptides?.length ? (
                  peptides.map((peptide) => (
                    <tr
                      key={peptide.id}
                      className="border-b last:border-b-0 hover:bg-[var(--color-surface-muted)]/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <Link
                          href={`/admin/peptides/${peptide.id}/edit`}
                          className="text-[var(--color-text)] underline decoration-transparent underline-offset-4 transition hover:text-[var(--color-accent)] hover:decoration-[var(--color-accent)]"
                        >
                          {peptide.name}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                        {peptide.category || "—"}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {peptide.default_vial_mg ||
                        peptide.default_mixing_volume_ml ||
                        peptide.default_sample_size_mcg ? (
                          <div className="flex flex-wrap gap-2">
                            {peptide.default_vial_mg ? (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                {peptide.default_vial_mg} mg
                              </span>
                            ) : null}

                            {peptide.default_mixing_volume_ml ? (
                              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                {peptide.default_mixing_volume_ml} mL
                              </span>
                            ) : null}

                            {peptide.default_sample_size_mcg ? (
                              <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                                {peptide.default_sample_size_mcg} mcg
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            Not set
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            peptide.published
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {peptide.published ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/admin/peptides/${peptide.id}/edit`}
                            className="text-[var(--color-accent)] underline"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/calculator?peptide=${encodeURIComponent(
                              peptide.name
                            )}&vialMg=${peptide.default_vial_mg ?? ""}&mixMl=${
                              peptide.default_mixing_volume_ml ?? ""
                            }&sampleMcg=${
                              peptide.default_sample_size_mcg ?? ""
                            }`}
                            className="text-[var(--color-text)] underline"
                          >
                            Calculator
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-[var(--color-muted)]"
                    >
                      No peptides found for this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          query={query}
          category={category}
        />
      </section>
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  query,
  category,
}: {
  currentPage: number;
  totalPages: number;
  query: string;
  category: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <Link
        href={buildPageHref({
          page: Math.max(1, currentPage - 1),
          query,
          category,
        })}
        aria-disabled={currentPage === 1}
        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
          currentPage === 1
            ? "pointer-events-none border-[var(--color-border)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
        }`}
      >
        Previous
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page, index, pages) => {
            const prevPage = pages[index - 1];
            const showGap = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center gap-2">
                {showGap ? (
                  <span className="px-1 text-sm text-[var(--color-muted)]">
                    …
                  </span>
                ) : null}

                <Link
                  href={buildPageHref({ page, query, category })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    page === currentPage
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {page}
                </Link>
              </div>
            );
          })}
      </div>

      <Link
        href={buildPageHref({
          page: Math.min(totalPages, currentPage + 1),
          query,
          category,
        })}
        aria-disabled={currentPage === totalPages}
        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
          currentPage === totalPages
            ? "pointer-events-none border-[var(--color-border)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]"
        }`}
      >
        Next
      </Link>
    </div>
  );
}

function buildPageHref({
  page,
  query,
  category,
}: {
  page: number;
  query: string;
  category: string;
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (query) {
    params.set("q", query);
  }

  if (category) {
    params.set("category", category);
  }

  const qs = params.toString();
  return qs ? `/admin/peptides?${qs}` : "/admin/peptides";
}