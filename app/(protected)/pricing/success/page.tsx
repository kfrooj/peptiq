import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Payment received
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Your subscription is being confirmed. This usually updates within a few
          seconds.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Go to Profile
          </Link>
          <Link
            href="/plans"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)]"
          >
            Back to Plans
          </Link>
        </div>
      </section>
    </main>
  );
}