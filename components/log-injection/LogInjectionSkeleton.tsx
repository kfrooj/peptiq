export default function LogInjectionSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="animate-pulse space-y-6">
        <div className="h-14 rounded-2xl border border-amber-200 bg-amber-50" />

        <div className="space-y-3">
          <div className="h-10 w-64 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-5 w-full max-w-2xl rounded bg-[var(--color-surface-muted)]" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-60 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-[560px] rounded-3xl bg-[var(--color-surface-muted)]" />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-44 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="space-y-2">
                    <div className="h-5 w-32 rounded bg-white/70" />
                    <div className="h-4 w-40 rounded bg-white/70" />
                    <div className="h-4 w-28 rounded bg-white/70" />
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