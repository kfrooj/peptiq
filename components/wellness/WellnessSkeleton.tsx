export default function WellnessSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="animate-pulse space-y-6">
        <section className="space-y-3">
          <div className="h-10 w-52 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-5 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
            >
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)]" />
                <div className="h-8 w-24 rounded bg-[var(--color-surface-muted)]" />
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="h-6 w-32 rounded bg-[var(--color-surface-muted)]" />
          <div className="mt-4 grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="mb-1 h-4 w-4 rounded bg-[var(--color-surface-muted)]" />
                <div className="flex h-24 items-end">
                  <div
                    className="w-6 rounded-t bg-[var(--color-surface-muted)]"
                    style={{ height: `${30 + index * 8}%` }}
                  />
                </div>
                <div className="mt-1 h-4 w-8 rounded bg-[var(--color-surface-muted)]" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex justify-between rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)]" />
                </div>
                <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)]" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}