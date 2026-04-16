export default function ProfileSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="animate-pulse space-y-4">
        {/* Personal Information + Subscription */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_0.9fr]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="mb-4 space-y-2">
              <div className="h-6 w-44 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-72 max-w-full rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <div className="space-y-3">
                  <div className="h-4 w-20 rounded bg-white/70" />
                  <div className="h-11 w-full rounded-xl bg-white/70" />
                  <div className="h-10 w-24 rounded-xl bg-white/70" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-3 sm:px-4"
                  >
                    <div className="space-y-2">
                      <div className="h-3 w-20 rounded bg-white/70" />
                      <div className="h-5 w-28 rounded bg-white/70" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="mb-4 space-y-2">
              <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-52 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-white/70" />
                <div className="h-8 w-24 rounded bg-white/70" />
                <div className="h-4 w-full rounded bg-white/70" />
                <div className="grid gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-10 rounded-xl bg-white/70"
                    />
                  ))}
                </div>
                <div className="h-11 w-full rounded-xl bg-white/70" />
              </div>
            </div>
          </section>
        </div>

        {/* Security & Account */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="mb-4 space-y-2">
            <div className="h-6 w-40 rounded bg-[var(--color-surface-muted)]" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="space-y-3">
                <div className="h-6 w-36 rounded bg-white/70" />
                <div className="h-4 w-52 rounded bg-white/70" />
                <div className="h-11 w-full rounded-xl bg-white/70" />
                <div className="h-11 w-full rounded-xl bg-white/70" />
                <div className="h-12 rounded-xl bg-white/70" />
                <div className="h-11 w-36 rounded-xl bg-white/70" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <div className="space-y-3">
                  <div className="h-6 w-32 rounded bg-white/70" />
                  <div className="h-4 w-48 rounded bg-white/70" />
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-11 rounded-xl bg-white/70"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications + Sharing */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="mb-4 space-y-2">
              <div className="h-6 w-28 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-64 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-36 rounded bg-white/70" />
                      <div className="h-4 w-56 rounded bg-white/70" />
                    </div>
                    <div className="mt-1 h-4 w-4 rounded bg-white/70" />
                  </div>
                </div>
              ))}

              <div className="h-11 w-40 rounded-xl bg-[var(--color-surface-muted)]" />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-white/70" />
                  <div className="h-4 w-64 rounded bg-white/70" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="mb-4 space-y-2">
              <div className="h-6 w-20 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-52 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-white/70" />
                <div className="h-4 w-52 rounded bg-white/70" />
                <div className="flex flex-col gap-3">
                  <div className="h-11 rounded-xl bg-white/70" />
                  <div className="h-11 rounded-xl bg-white/70" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Favorites */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-6 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-4 w-56 rounded bg-[var(--color-surface-muted)]" />
            </div>

            <div className="h-10 w-36 rounded-xl bg-[var(--color-surface-muted)]" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, columnIndex) => (
              <div key={columnIndex}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-5 w-36 rounded bg-[var(--color-surface-muted)]" />
                  <div className="h-4 w-8 rounded bg-[var(--color-surface-muted)]" />
                </div>

                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((__, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"
                    >
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-white/70" />
                        <div className="h-4 w-24 rounded bg-white/70" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}