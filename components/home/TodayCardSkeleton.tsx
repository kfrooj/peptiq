export default function TodayCardSkeleton() {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="animate-pulse space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-24 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-4 w-56 rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-[var(--color-surface-muted)]" />
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <div className="space-y-3">
            <div className="h-4 w-20 rounded bg-white/70" />
            <div className="h-6 w-48 rounded bg-white/70" />
            <div className="h-4 w-28 rounded bg-white/70" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4"
            >
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-[var(--color-surface-muted)]" />
                <div className="h-8 w-16 rounded bg-[var(--color-surface-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}