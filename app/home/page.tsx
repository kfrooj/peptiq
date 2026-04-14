import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TodayCardSection from "@/components/home/TodayCardSection";
import TodayCardSkeleton from "@/components/home/TodayCardSkeleton";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/log-injection" : "/login";
  const primaryLabel = user ? "Log Injection" : "Get Started";

  return (
    <main className="page-fade-in min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="space-y-8">
          {user ? (
            <Suspense fallback={<TodayCardSkeleton />}>
              <TodayCardSection userId={user.id} />
            </Suspense>
          ) : null}

          <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div>
              <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-muted)] shadow-sm">
                • Research • dose calculation • protocol planning & tracking •
              </span>

              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-[var(--color-text)] sm:mt-6 sm:text-4xl lg:text-5xl">
                {user
                  ? "Stay on top of your peptide protocols."
                  : "PEPTIQ helps you plan, track, and stay consistent with peptide protocols."}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:mt-5 sm:text-base lg:text-lg">
                Built for clarity and consistency, PEPT|IQ combines peptide
                reference material, dosage planning, stack building, injection
                tracking, and adherence reminders in one place.
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:mt-4 sm:text-base lg:text-lg">
                {user
                  ? "Review what’s due today, log injections, and keep your plans moving." 
                  : "Sign up to access personalised features."}
              </p>
              <div>
                <Link
                  href="https://peptiq.uk/login"
                  className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-accent)] sm:mt-4 sm:text-base lg:text-lg">
                
                  • Sign up to access personalised features •
                </Link>
            
</div>
              <div className="mt-6 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  {primaryLabel}
                </Link>

                <Link
                  href="/peptides"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  Browse Peptides
                </Link>

                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  Open Calculator
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                      One place for protocol clarity
                    </h2>
                  </div>

                  <div className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text)] shadow-sm">
                    PEPTIQ
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:mt-6">
                  <FeatureLink
                    href="/peptides"
                    title="Peptide Library"
                    description="Browse structured reference content and defaults."
                  />
                  <FeatureLink
                    href="/calculator"
                    title="Dose Calculator"
                    description="Estimate dosage with syringe-based visualization."
                  />
                  <FeatureLink
                    href={user ? "/log-injection" : "/login"}
                    title="Plan + Log"
                    description="Track injections, reminders, and adherence."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:bg-[var(--color-surface-muted)]"
    >
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
    </Link>
  );
}