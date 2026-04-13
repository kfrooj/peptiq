export default function PlansSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-10 w-52 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-5 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-[520px] rounded-3xl bg-[var(--color-surface-muted)]" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
                >
                  <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-white/70" />
                    <div className="h-4 w-32 rounded bg-white/70" />
                    <div className="h-4 w-24 rounded bg-white/70" />
                    <div className="h-4 w-28 rounded bg-white/70" />
                    <div className="h-4 w-20 rounded bg-white/70" />
                    <div className="h-24 rounded-2xl bg-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}