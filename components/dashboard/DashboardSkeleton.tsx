export default function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="animate-pulse space-y-5 sm:space-y-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-8 w-40 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-4 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-[var(--color-surface-muted)]" />
                <div className="h-8 w-24 rounded bg-[var(--color-surface-muted)]" />
                <div className="h-3 w-28 rounded bg-[var(--color-surface-muted)]" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-56 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-4 h-32 rounded-2xl bg-[var(--color-surface-muted)]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="space-y-3 pt-2">
                <div className="h-20 rounded-2xl bg-[var(--color-surface-muted)]" />
                <div className="h-20 rounded-2xl bg-[var(--color-surface-muted)]" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-32 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-48 rounded bg-[var(--color-surface-muted)]" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 rounded-2xl bg-[var(--color-surface-muted)]"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-36 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 rounded-2xl bg-[var(--color-surface-muted)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}