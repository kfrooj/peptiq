import Link from "next/link";


export default function PricingCancelPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Checkout canceled
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          No changes were made to your subscription.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Back to Pricing
          </Link>
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)]"
          >
            Back to Profile
          </Link>
        </div>
      </section>
    </main>
  );
}