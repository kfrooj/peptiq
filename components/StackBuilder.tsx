"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { saveStack } from "@/app/stacks/actions";
import PeptideFavoriteStarButton from "@/components/PeptideFavoriteStarButton";

type Peptide = {
  id: string;
  name: string;
  category: string | null;
  benefits: string | null;
  published?: boolean;
};

type StackItem = {
  id: string;
  name: string;
  category: string | null;
  benefits: string | null;
  note: string;
};

type InitialStack = {
  id: string;
  name: string;
  items: StackItem[];
} | null;

type Props = {
  peptides: Peptide[];
  initialStack?: InitialStack;
  favoritePeptideIds?: string[];
};

const LOCAL_STACK_ITEMS_KEY = "peptiq_stack";
const LOCAL_STACK_NAME_KEY = "peptiq_stack_name";
const LOCAL_STACK_ID_KEY = "peptiq_stack_id";

export default function StackBuilder({
  peptides,
  initialStack = null,
  favoritePeptideIds = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [currentStackId, setCurrentStackId] = useState<string | null>(
    initialStack?.id || null
  );
  const [stackName, setStackName] = useState(
    initialStack?.name || "My Research Stack"
  );
  const [stackItems, setStackItems] = useState<StackItem[]>(
    initialStack?.items || []
  );
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasLoadedLocalState, setHasLoadedLocalState] = useState(false);

  const favoritePeptideIdSet = useMemo(
    () => new Set(favoritePeptideIds),
    [favoritePeptideIds]
  );

  useEffect(() => {
    if (initialStack) {
      setCurrentStackId(initialStack.id);
      setStackName(initialStack.name || "My Research Stack");
      setStackItems(initialStack.items || []);
      setSaveMessage("");
      setSaveError("");
      setHasLoadedLocalState(true);
      return;
    }

    try {
      const savedItemsRaw = localStorage.getItem(LOCAL_STACK_ITEMS_KEY);
      const savedName = localStorage.getItem(LOCAL_STACK_NAME_KEY);
      const savedStackId = localStorage.getItem(LOCAL_STACK_ID_KEY);

      const savedItems = savedItemsRaw ? JSON.parse(savedItemsRaw) : null;

      if (Array.isArray(savedItems)) {
        setStackItems(savedItems);
      }

      if (savedName !== null) {
        setStackName(savedName);
      }

      if (savedStackId) {
        setCurrentStackId(savedStackId);
      } else {
        setCurrentStackId(null);
      }
    } catch {
      localStorage.removeItem(LOCAL_STACK_ITEMS_KEY);
      localStorage.removeItem(LOCAL_STACK_NAME_KEY);
      localStorage.removeItem(LOCAL_STACK_ID_KEY);
    }

    setHasLoadedLocalState(true);
  }, [initialStack]);

  useEffect(() => {
    if (!hasLoadedLocalState) return;

    try {
      localStorage.setItem(LOCAL_STACK_ITEMS_KEY, JSON.stringify(stackItems));
      localStorage.setItem(LOCAL_STACK_NAME_KEY, stackName);

      if (currentStackId) {
        localStorage.setItem(LOCAL_STACK_ID_KEY, currentStackId);
      } else {
        localStorage.removeItem(LOCAL_STACK_ID_KEY);
      }
    } catch {
      // Ignore localStorage write errors
    }
  }, [stackItems, stackName, currentStackId, hasLoadedLocalState]);

  const filteredPeptides = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return peptides;

    return peptides.filter((peptide) => {
      return (
        peptide.name.toLowerCase().includes(term) ||
        (peptide.category ?? "").toLowerCase().includes(term) ||
        (peptide.benefits ?? "").toLowerCase().includes(term)
      );
    });
  }, [search, peptides]);

  function addToStack(peptide: Peptide) {
    const alreadyAdded = stackItems.some((item) => item.id === peptide.id);

    if (alreadyAdded) return;

    setStackItems((current) => [
      ...current,
      {
        id: peptide.id,
        name: peptide.name,
        category: peptide.category,
        benefits: peptide.benefits,
        note: "",
      },
    ]);

    setSaveMessage("");
    setSaveError("");
  }

  function removeFromStack(id: string) {
    setStackItems((current) => current.filter((item) => item.id !== id));
    setSaveMessage("");
    setSaveError("");
  }

  function updateNote(id: string, note: string) {
    setStackItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              note,
            }
          : item
      )
    );

    setSaveMessage("");
    setSaveError("");
  }

  function clearStack() {
    setStackItems([]);
    setStackName("");
    setCurrentStackId(null);
    setSaveMessage("");
    setSaveError("");

    try {
      localStorage.removeItem(LOCAL_STACK_ITEMS_KEY);
      localStorage.removeItem(LOCAL_STACK_NAME_KEY);
      localStorage.removeItem(LOCAL_STACK_ID_KEY);
    } catch {
      // Ignore localStorage remove errors
    }
  }

  async function copyStack() {
    if (stackItems.length === 0) return;

    const lines: string[] = [];

    lines.push(`Stack: ${stackName || "Untitled Stack"}`);
    lines.push(`Total peptides: ${stackItems.length}`);
    lines.push("");

    stackItems.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`   Category: ${item.category || "Uncategorized"}`);

      if (item.benefits) {
        lines.push(`   Benefits: ${item.benefits}`);
      }

      if (item.note.trim()) {
        lines.push(`   Note: ${item.note.trim()}`);
      }

      lines.push("");
    });

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleSaveStack() {
    setSaveMessage("");
    setSaveError("");

    startTransition(async () => {
      const result = await saveStack({
        stackId: currentStackId,
        name: stackName,
        items: stackItems.map((item, index) => ({
          peptide_id: item.id,
          note: item.note,
          position: index,
        })),
      });

      if (result.success) {
        setCurrentStackId(result.stackId ?? null);
        setSaveMessage(
          result.mode === "updated"
            ? "Stack updated successfully."
            : "Stack saved successfully."
        );
      } else {
        setSaveError(result.error || "Could not save stack.");
      }
    });
  }

  const categorySummary = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const item of stackItems) {
      const key = item.category || "Uncategorized";
      counts[key] = (counts[key] || 0) + 1;
    }

    return Object.entries(counts);
  }, [stackItems]);

  const isEditingExistingStack = !!currentStackId;

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">
          Available Peptides
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Search by name, category, or benefit and add peptides to your stack.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Search peptides
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or benefit"
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-6 grid gap-4">
          {filteredPeptides.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
              No peptides found.
            </div>
          ) : (
            filteredPeptides.map((peptide) => {
              const alreadyAdded = stackItems.some(
                (item) => item.id === peptide.id
              );

              return (
                <div
                  key={peptide.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="relative">
                    <div className="absolute right-0 top-0 flex flex-col items-end gap-2">
                      <PeptideFavoriteStarButton
                        peptideId={peptide.id}
                        initialIsFavorite={favoritePeptideIdSet.has(peptide.id)}
                      />

                      <button
                        type="button"
                        onClick={() => addToStack(peptide)}
                        disabled={alreadyAdded}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          alreadyAdded
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-[var(--color-accent)] text-white hover:opacity-90"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "Add to stack"}
                      </button>
                    </div>

                    <div className="pr-36">
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        {peptide.name}
                      </h3>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Category: {peptide.category || "Uncategorized"}
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        {peptide.benefits || "No benefit summary yet."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">
              Your Stack
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {stackItems.length} peptide
              {stackItems.length === 1 ? "" : "s"} selected
            </p>
          </div>

          <button
            type="button"
            onClick={clearStack}
            disabled={stackItems.length === 0 && !stackName}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              stackItems.length === 0 && !stackName
                ? "cursor-not-allowed border-slate-200 text-slate-400"
                : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            Clear all
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
            Stack name
          </label>
          <input
            type="text"
            value={stackName}
            onChange={(e) => {
              setStackName(e.target.value);
              setSaveMessage("");
              setSaveError("");
            }}
            placeholder="Enter a stack name"
            className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSaveStack}
            disabled={isPending || stackItems.length === 0}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
              isPending || stackItems.length === 0
                ? "cursor-not-allowed bg-slate-400"
                : "bg-[var(--color-accent)] hover:opacity-90"
            }`}
          >
            {isPending
              ? isEditingExistingStack
                ? "Updating..."
                : "Saving..."
              : isEditingExistingStack
              ? "Update stack"
              : "Save stack"}
          </button>

          <button
            type="button"
            onClick={copyStack}
            disabled={stackItems.length === 0}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              stackItems.length === 0
                ? "cursor-not-allowed border-slate-200 text-slate-400"
                : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            {copied ? "Copied ✓" : "Copy stack"}
          </button>
        </div>

        {isEditingExistingStack ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            You are editing an existing saved stack.
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {saveMessage}
          </div>
        ) : null}

        {saveError ? (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        {stackItems.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {stackName || "Untitled Stack"}
            </p>

            <div className="mt-3 space-y-3 text-sm text-[var(--color-muted)]">
              <p>Total peptides: {stackItems.length}</p>

              {categorySummary.length > 0 ? (
                <div>
                  <p className="font-medium text-[var(--color-text)]">
                    Categories
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categorySummary.map(([category, count]) => (
                      <span
                        key={category}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]"
                      >
                        {category}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {stackItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
              Add peptides from the left side to start building your stack.
            </div>
          ) : (
            stackItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                      Item {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Category: {item.category || "Uncategorized"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {item.benefits || "No benefit summary yet."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromStack(item.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                    Note
                  </label>
                  <textarea
                    value={item.note}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    placeholder="Example: compare this with another recovery peptide later"
                    rows={3}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}