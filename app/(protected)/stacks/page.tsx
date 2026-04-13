import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteStack } from "./actions";
import StackBuilder from "@/components/StackBuilder";
import DeleteStackButton from "@/components/DeleteStackButton";
import StackFavoriteButton from "@/components/StackFavoriteButton";

type SavedStack = {
  id: string;
  name: string;
  created_at: string | null;
  stack_items: { id: string }[];
};

type LoadedStackItem = {
  id: string;
  name: string;
  category: string | null;
  benefits: string | null;
  note: string;
};

type LoadedStack = {
  id: string;
  name: string;
  items: LoadedStackItem[];
} | null;

export default async function StacksPage({
  searchParams,
}: {
  searchParams: Promise<{ stackId?: string }>;
}) {
  const { stackId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: peptides, error: peptidesError } = await supabase
    .from("peptides")
    .select("id, name, category, benefits, published")
    .eq("published", true)
    .order("name", { ascending: true });

  if (peptidesError) {
    throw new Error(peptidesError.message);
  }

  let savedStacks: SavedStack[] = [];
  let favoriteStackIds = new Set<string>();
  let favoritePeptideIds = new Set<string>();
  let loadedStack: LoadedStack = null;

  if (user) {
    const { data: savedStacksData, error: stacksError } = await supabase
      .from("stacks")
      .select("id, name, created_at, stack_items(id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (stacksError) {
      throw new Error(stacksError.message);
    }

    savedStacks = savedStacksData ?? [];

    const { data: favoriteStacks, error: favoriteStacksError } = await supabase
      .from("favorite_stacks")
      .select("stack_id")
      .eq("user_id", user.id);

    if (favoriteStacksError) {
      throw new Error(favoriteStacksError.message);
    }

    favoriteStackIds = new Set(
      (favoriteStacks ?? []).map((item) => item.stack_id)
    );

    const { data: favoritePeptides, error: favoritePeptidesError } =
      await supabase
        .from("favorite_peptides")
        .select("peptide_id")
        .eq("user_id", user.id);

    if (favoritePeptidesError) {
      throw new Error(favoritePeptidesError.message);
    }

    favoritePeptideIds = new Set(
      (favoritePeptides ?? []).map((item) => item.peptide_id)
    );

    if (stackId) {
      const { data: selectedStack, error: selectedStackError } = await supabase
        .from("stacks")
        .select(
          `
            id,
            name,
            stack_items (
              id,
              note,
              position,
              peptide:peptides (
                id,
                name,
                category,
                benefits
              )
            )
          `
        )
        .eq("id", stackId)
        .eq("user_id", user.id)
        .single();

      if (!selectedStackError && selectedStack) {
        const items = (selectedStack.stack_items ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((item: any) => ({
            id: item.peptide.id,
            name: item.peptide.name,
            category: item.peptide.category,
            benefits: item.peptide.benefits,
            note: item.note ?? "",
          }));

        loadedStack = {
          id: selectedStack.id,
          name: selectedStack.name,
          items,
        };
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Stack Builder
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Build a custom peptide stack by selecting published peptides from your
          database.
        </p>
      </div>

      <StackBuilder
        peptides={peptides ?? []}
        initialStack={loadedStack}
        favoritePeptideIds={[...favoritePeptideIds]}
      />

      {user ? (
        <section className="mt-8 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Saved Stacks
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Previously saved stacks from your database.
          </p>

          <div className="mt-6 grid gap-4">
            {!savedStacks.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
                No saved stacks yet.
              </div>
            ) : (
              savedStacks.map((stack: SavedStack) => {
                const itemCount = stack.stack_items?.length ?? 0;
                const createdAt = stack.created_at
                  ? new Date(stack.created_at).toLocaleString()
                  : "Unknown date";

                return (
                  <div
                    key={stack.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                          {stack.name}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {itemCount} peptide{itemCount === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          Saved: {createdAt}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StackFavoriteButton
                          stackId={stack.id}
                          initialIsFavorite={favoriteStackIds.has(stack.id)}
                        />

                        <Link
                          href={`/stacks?stackId=${stack.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                        >
                          Load
                        </Link>

                        <form
                          action={async () => {
                            "use server";
                            await deleteStack(stack.id);
                          }}
                        >
                          <DeleteStackButton stackName={stack.name} />
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[var(--color-text)]">
            Save Your Stacks
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Log in to save stacks, favorite peptides, and track your wellness
            routine.
          </p>

          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Log in
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}