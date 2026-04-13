export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-pulse">
          <div className="mb-8 space-y-3">
            <div className="h-10 w-40 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-5 w-full max-w-2xl rounded bg-[var(--color-surface-muted)]" />
          </div>

          <div className="space-y-3">
            <div className="h-12 rounded-2xl bg-[var(--color-surface-muted)]" />
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-2xl bg-[var(--color-surface-muted)]"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}