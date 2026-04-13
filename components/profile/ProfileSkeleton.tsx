export default function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="mb-5 space-y-2">
              <div className="h-6 w-44 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-white/70" />
                    <div className="h-5 w-36 rounded bg-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-10 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-11 w-full rounded-xl bg-[var(--color-surface-muted)]" />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-5 space-y-2">
            <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
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
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="mb-5 space-y-2">
              <div className="h-6 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-64 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="h-5 w-32 rounded bg-[var(--color-surface-muted)]" />
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((__, innerIndex) => (
                      <div
                        key={innerIndex}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                      >
                        <div className="space-y-2">
                          <div className="h-4 w-28 rounded bg-white/70" />
                          <div className="h-4 w-20 rounded bg-white/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="space-y-3">
              <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-white/70" />
                    <div className="h-4 w-48 rounded bg-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
              <div className="space-y-3">
                <div className="h-6 w-36 rounded bg-white/70" />
                <div className="h-4 w-64 rounded bg-white/70" />
                <div className="h-32 rounded-2xl bg-white/70" />
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
                >
                  <div className="space-y-2">
                    <div className="h-6 w-32 rounded bg-white/70" />
                    <div className="h-4 w-48 rounded bg-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}