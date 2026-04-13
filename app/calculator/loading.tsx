export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
          <div className="mb-4 h-6 w-32 rounded-full bg-[var(--color-surface-muted)]" />
          <div className="h-10 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-5 w-full max-w-3xl rounded bg-[var(--color-surface-muted)]" />
          <div className="mt-6 h-[420px] rounded-3xl bg-[var(--color-surface-muted)]" />
        </section>
      </section>
    </main>
  );
}