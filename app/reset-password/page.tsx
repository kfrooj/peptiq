"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      setErrorMessage(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setErrorMessage(error.message);
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
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
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
      setErrorMessage(error.message);
      return;
    }

    if (user?.email) {
      try {
        await fetch("/api/email/password-changed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
          }),
        });
      } catch (emailError) {
        console.error("Password reset email trigger error:", emailError);
      }
    }

    setMessage("Password updated successfully. Redirecting to home...");
    setPassword("");
    setConfirmPassword("");
    setSaving(false);

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Enter a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              New Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loadingSession || !sessionReady || saving}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Confirm New Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loadingSession || !sessionReady || saving}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 disabled:bg-gray-50"
            />
          </label>

          {loadingSession && (
            <p className="text-sm text-[var(--color-muted)]">
              Preparing secure reset session...
            </p>
          )}

          {errorMessage && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{errorMessage}</p>

              <Link
                href="/forgot-password"
                className="inline-block text-sm text-blue-600 hover:text-blue-500"
              >
                Request a new reset link
              </Link>

              <br />

              <Link
                href="/login"
                className="inline-block text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Back to login
              </Link>
            </div>
          )}

          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={saving || loadingSession || !sessionReady}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}