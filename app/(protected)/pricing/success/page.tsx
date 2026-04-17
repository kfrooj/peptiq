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

  const showLongerDelayMessage = seconds >= 8 && syncState === "checking";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-3xl items-center px-4 py-6 sm:px-6">
      <section className="w-full rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <span className="text-xl font-semibold">✓</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Payment confirmed
          </h1>

          <p className="mt-3 text-base text-[var(--color-muted)]">
            We’re now activating your Pro access.
          </p>

          {syncState === "checking" || syncState === "active" ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 sm:p-6">
              <div className="mx-auto flex h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />

              <h2 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
                Activating your Pro access…
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                This usually takes a few seconds.
              </p>

              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Please keep this page open while we confirm your subscription.
              </p>

              {showLongerDelayMessage ? (
                <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
                  Still checking your billing status. This can occasionally take a
                  little longer than usual.
                </p>
              ) : null}
            </div>
          ) : null}

          {syncState === "timeout" ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
              <p className="text-sm font-medium text-amber-900">
                Your payment went through, but activation is taking longer than expected.
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                This can happen if the billing webhook is delayed. You can continue
                to your profile now and refresh shortly.
              </p>
            </div>
          ) : null}

          {syncState === "error" ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-left">
              <p className="text-sm font-medium text-rose-700">
                We could not confirm your subscription automatically.
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-600">
                Your payment may still be processing. Please open your profile and
                check again in a few seconds.
              </p>
            </div>
          ) : null}

          {(syncState === "timeout" || syncState === "error") ? (
            <>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
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
            </>
          ) : (
            <p className="mt-6 text-xs text-[var(--color-muted)]">
              You’ll be redirected automatically as soon as your account is ready.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}