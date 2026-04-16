"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SyncState = "checking" | "active" | "timeout" | "error";

export default function PricingSuccessPage() {
  const supabase = useMemo(() => createClient(), []);
  const [syncState, setSyncState] = useState<SyncState>("checking");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 12; // ~24 seconds at 2s interval

    async function checkSubscription() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) {
            setSyncState("error");
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          if (isMounted) {
            setSyncState("error");
          }
          return;
        }

        const status = profile?.subscription_status ?? null;

        if (status === "active" || status === "trialing") {
          if (isMounted) {
            setSyncState("active");
          }

          window.location.href = "/profile";
          return;
        }

        attempts += 1;

        if (isMounted) {
          setSeconds(attempts * 2);
        }

        if (attempts >= maxAttempts) {
          if (isMounted) {
            setSyncState("timeout");
          }
          return;
        }

        setTimeout(checkSubscription, 2000);
      } catch {
        if (isMounted) {
          setSyncState("error");
        }
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl text-green-700">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Payment successful
          </h1>
        </div>

        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Your Pro subscription is being activated.
        </p>

        {syncState === "checking" ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-sm text-[var(--color-text)]">
              Waiting for billing confirmation…
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Checked for {seconds}s. You’ll be redirected automatically once your
              account updates.
            </p>
          </div>
        ) : null}

        {syncState === "timeout" ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Payment went through, but subscription syncing is taking longer than
              expected.
            </p>
            <p className="mt-1 text-xs text-amber-800">
              This can happen if the billing webhook is delayed. You can continue
              now and refresh your profile shortly.
            </p>
          </div>
        ) : null}

        {syncState === "error" ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">
              We could not confirm your subscription status automatically.
            </p>
            <p className="mt-1 text-xs text-rose-600">
              Your payment may still be processing. Please open your profile and
              refresh after a few seconds.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Go to Profile
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Continue to Dashboard
          </Link>
        </div>

        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Once syncing completes, your account should show Pro access automatically.
        </p>
      </section>
    </main>
  );
}