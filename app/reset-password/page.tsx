"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getFriendlyResetError(message?: string) {
  const lower = (message || "").toLowerCase();

  if (lower.includes("session")) {
    return "Your reset session is invalid or has expired. Please request a new reset link.";
  }

  if (lower.includes("password")) {
    return "We could not update your password. Please check your password and try again.";
  }

  if (lower.includes("expired")) {
    return "Your reset link has expired. Please request a new one.";
  }

  return "We could not update your password right now. Please try again.";
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      setErrorMessage(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setErrorMessage(
          "We could not verify your reset session. Please request a new reset link."
        );
        setLoadingSession(false);
        return;
      }

      if (!session) {
        setErrorMessage("Your reset link has expired or is invalid.");
        setLoadingSession(false);
        return;
      }

      setSessionReady(true);
      setLoadingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        if (session) {
          setSessionReady(true);
          setLoadingSession(false);
          setErrorMessage(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for your password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!sessionReady) {
      setErrorMessage(
        "Reset session missing. Please request a new password reset email."
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setSaving(false);
      setErrorMessage(getFriendlyResetError(error.message));
      return;
    }

    if (user?.email) {
      try {
        const response = await fetch("/api/email/password-changed", {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          console.error(
            "Password changed email failed:",
            data ?? response.statusText
          );
        }
      } catch (emailError) {
        console.error("Password changed email trigger error:", emailError);
      }
    }

    setMessage("Password updated successfully. Redirecting to dashboard...");
    setPassword("");
    setConfirmPassword("");
    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Reset password
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Enter a new password for your PEPT|IQ account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              New password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loadingSession || !sessionReady || saving}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Confirm new password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loadingSession || !sessionReady || saving}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </label>

          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Use at least 8 characters for your password.
          </p>

          {loadingSession ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-muted)]">
              Preparing secure reset session...
            </div>
          ) : null}

          {errorMessage ? (
            <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              <p>{errorMessage}</p>

              <div className="flex flex-col gap-2">
                <Link
                  href="/forgot-password"
                  className="text-[var(--color-accent)] transition hover:opacity-80"
                >
                  Request a new reset link
                </Link>

                <Link
                  href="/login"
                  className="text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving || loadingSession || !sessionReady}
            className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}