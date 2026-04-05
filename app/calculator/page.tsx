import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CalculatorPageClient from "../../components/CalculatorPageClient";

async function CalculatorPageContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex items-center justify-between gap-4 md:hidden">
          <Link href="/" className="shrink-0">
            <Image
              src="/peptiq-logo.png"
              alt="PEPTIQ"
              width={180}
              height={44}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <CalculatorPageClient />
      </section>
    </main>
  );
}

function CalculatorFallback() {
  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 md:hidden">
          <Image
            src="/peptiq-logo.png"
            alt="PEPTIQ"
            width={180}
            height={44}
            priority
            className="h-8 w-auto"
          />
        </div>

        <section className="mb-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
          <div className="mb-4 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            Research use only
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Peptide Reconstitution Calculator
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            Calculate concentration, required volume, and syringe units for
            research preparation. This tool is for informational and research
            purposes only.
          </p>
        </section>
      </section>
    </main>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<CalculatorFallback />}>
      <CalculatorPageContent />
    </Suspense>
  );
}