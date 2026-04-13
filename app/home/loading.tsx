import TodayCardSkeleton from "@/components/home/TodayCardSkeleton";

export default function Loading() {
  return (
    <main className="page-fade-in min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="space-y-8">
          <TodayCardSkeleton />

          <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div className="animate-pulse space-y-4">
              <div className="h-7 w-56 rounded-full bg-[var(--color-surface-muted)]" />
              <div className="h-12 w-full max-w-2xl rounded bg-[var(--color-surface-muted)]" />
              <div className="h-5 w-full max-w-2xl rounded bg-[var(--color-surface-muted)]" />
              <div className="h-5 w-full max-w-xl rounded bg-[var(--color-surface-muted)]" />

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                <div className="h-12 w-36 rounded-2xl bg-[var(--color-surface-muted)]" />
                <div className="h-12 w-40 rounded-2xl bg-[var(--color-surface-muted)]" />
                <div className="h-12 w-40 rounded-2xl bg-[var(--color-surface-muted)]" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <div className="animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="h-6 w-48 rounded bg-white/70" />
                  <div className="space-y-3 pt-3">
                    <div className="h-16 rounded-2xl bg-white/70" />
                    <div className="h-16 rounded-2xl bg-white/70" />
                    <div className="h-16 rounded-2xl bg-white/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}