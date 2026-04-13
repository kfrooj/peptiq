"use client";

import { useState, useTransition } from "react";
import { createUserNote } from "@/app/(protected)/dashboard/actions";

export default function NewNoteForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const result = await createUserNote({
        title,
        content,
      });

      if (result.success) {
        setTitle("");
        setContent("");
        setMessage("Note saved.");
      } else {
        setError(result.error || "Could not save note.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <h3 className="text-sm font-medium text-[var(--color-text)]">
        Add a note
      </h3>

      <div className="mt-3 grid gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          rows={4}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
            isPending
              ? "cursor-not-allowed bg-slate-400"
              : "bg-[var(--color-accent)] hover:opacity-90"
          }`}
        >
          {isPending ? "Saving..." : "Save note"}
        </button>

        {message ? (
          <p className="text-sm text-green-700">{message}</p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}