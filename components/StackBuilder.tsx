"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { saveStack } from "@/app/(protected)/stacks/actions";
import PeptideFavoriteStarButton from "@/components/PeptideFavoriteStarButton";

type Peptide = {
  id: string;
  name: string;
  category: string | null;
  published?: boolean;
};

type StackItem = {
  id: string;
  name: string;
  category: string | null;
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

function getCategoryStyle(category?: string | null) {
  const value = (category || "").toLowerCase();

  if (value.includes("fat") || value.includes("weight")) {
    return {
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      chip: "bg-emerald-100 text-emerald-700",
      icon: "🔥",
    };
  }

  if (value.includes("healing") || value.includes("recovery")) {
    return {
      bg: "bg-blue-50",
      ring: "ring-blue-100",
      chip: "bg-blue-100 text-blue-700",
      icon: "🛠️",
    };
  }

  if (value.includes("cognitive") || value.includes("brain")) {
    return {
      bg: "bg-purple-50",
      ring: "ring-purple-100",
      chip: "bg-purple-100 text-purple-700",
      icon: "🧠",
    };
  }

  if (value.includes("longevity") || value.includes("anti")) {
    return {
      bg: "bg-amber-50",
      ring: "ring-amber-100",
      chip: "bg-amber-100 text-amber-700",
      icon: "⏳",
    };
  }

  return {
    bg: "bg-gray-50",
    ring: "ring-gray-100",
    chip: "bg-gray-100 text-gray-700",
    icon: "🧬",
  };
}

export default function StackBuilder({
  peptides,
  initialStack = null,
  favoritePeptideIds = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        peptides
          .map((peptide) => peptide.category)
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [peptides]);

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

    return peptides.filter((peptide) => {
      const matchesSearch =
        !term ||
        peptide.name.toLowerCase().includes(term) ||
        (peptide.category ?? "").toLowerCase().includes(term);

      const matchesCategory =
        !selectedCategory || peptide.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, peptides, selectedCategory]);

  function addToStack(peptide: Peptide) {
    const alreadyAdded = stackItems.some((item) => item.id === peptide.id);
    if (alreadyAdded) return;

    setStackItems((current) => [
      ...current,
      {
        id: peptide.id,
        name: peptide.name,
        category: peptide.category,
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
          note: "",
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
    <div className="w-full overflow-x-hidden">
      <div className="grid gap-4 md:gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <section className="min-w-0 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
            Available Peptides
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Search by name or category and add peptides to your stack.
          </p>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
              Search peptides
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
            />
          </div>

          <div className="mt-3 -mx-1 overflow-x-auto">
            <div className="flex min-w-max gap-2 px-1 pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === ""
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                }`}
              >
                All
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selectedCategory === category
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {filteredPeptides.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
                No peptides found.
              </div>
            ) : (
              filteredPeptides.map((peptide) => {
                const alreadyAdded = stackItems.some(
                  (item) => item.id === peptide.id
                );
                const style = getCategoryStyle(peptide.category);

                return (
                  <div
                    key={peptide.id}
                    className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] ${style.bg} px-3 py-2`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs ring-1 ${style.ring}`}
                      >
                        {style.icon}
                      </span>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-[var(--color-text)]">
                          {peptide.name}
                        </p>
                        <p className="truncate text-[11px] text-[var(--color-muted)]">
                          {peptide.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      <PeptideFavoriteStarButton
                        peptideId={peptide.id}
                        initialIsFavorite={favoritePeptideIdSet.has(peptide.id)}
                      />

                      <button
                        type="button"
                        onClick={() => addToStack(peptide)}
                        disabled={alreadyAdded}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          alreadyAdded
                            ? "cursor-not-allowed bg-slate-200 text-slate-500"
                            : "bg-[var(--color-accent)] text-white hover:opacity-90"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
                Your Stack
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {stackItems.length} peptide{stackItems.length === 1 ? "" : "s"} selected
              </p>
            </div>

            <button
              type="button"
              onClick={clearStack}
              disabled={stackItems.length === 0 && !stackName}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                stackItems.length === 0 && !stackName
                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                  : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              }`}
            >
              Clear
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

          <div className="mt-4 flex flex-wrap gap-2">
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
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">
                  {stackName || "Untitled Stack"}
                </p>
                <span className="inline-flex w-fit shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]">
                  {stackItems.length} total
                </span>
              </div>

              {categorySummary.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categorySummary.map(([category, count]) => (
                    <span
                      key={category}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)]"
                    >
                      {category}: {count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {stackItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
                Add peptides from the left to build your stack.
              </div>
            ) : (
              stackItems.map((item) => {
                const style = getCategoryStyle(item.category);

                return (
                  <div
                    key={item.id}
                    className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] ${style.bg} px-3 py-2`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs ring-1 ${style.ring}`}
                      >
                        {style.icon}
                      </span>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-[var(--color-text)]">
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] text-[var(--color-muted)]">
                          {item.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromStack(item.id)}
                      className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}