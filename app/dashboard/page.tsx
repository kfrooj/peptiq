import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewNoteForm from "@/components/NewNoteForm";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: favoritePeptides, error: favoritePeptidesError } = await supabase
    .from("favorite_peptides")
    .select(
      `
        id,
        created_at,
        peptide:peptides (
          id,
          name,
          category,
          benefits
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (favoritePeptidesError) {
    throw new Error(favoritePeptidesError.message);
  }

  const { data: favoriteStacks, error: favoriteStacksError } = await supabase
    .from("favorite_stacks")
    .select(
      `
        id,
        created_at,
        stack:stacks (
          id,
          name,
          created_at
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (favoriteStacksError) {
    throw new Error(favoriteStacksError.message);
  }

  const { data: notes, error: notesError } = await supabase
    .from("user_notes")
    .select("id, title, content, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (notesError) {
    throw new Error(notesError.message);
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Your Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          View your favorite peptides, favorite stacks, and personal notes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Favorite Peptides
          </h2>

          <div className="mt-4 grid gap-4">
            {!favoritePeptides?.length ? (
              <p className="text-sm text-[var(--color-muted)]">
                No favorite peptides yet.
              </p>
            ) : (
              favoritePeptides.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {item.peptide?.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {item.peptide?.category || "Uncategorized"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {item.peptide?.benefits || "No benefit summary yet."}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Favorite Stacks
          </h2>

          <div className="mt-4 grid gap-4">
            {!favoriteStacks?.length ? (
              <p className="text-sm text-[var(--color-muted)]">
                No favorite stacks yet.
              </p>
            ) : (
              favoriteStacks.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {item.stack?.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Saved stack
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Personal Notes
          </h2>

<div className="mt-4">
  <NewNoteForm />
</div>

          <div className="mt-4 grid gap-4">
            {!notes?.length ? (
              <p className="text-sm text-[var(--color-muted)]">
                No notes yet.
              </p>
            ) : (
              notes.map((note: any) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {note.title || "Untitled note"}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)] whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}