"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Your email or password is incorrect.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  if (lower.includes("password")) {
    return "Please check your password and try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setMessage(null);
    setIsLoading(true);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setError(getFriendlyAuthError(error.message));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Login failed. Please try again.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Could not load your account.");
        return;
      }

      if (profile?.role !== "admin") {
        setError("You do not have admin access.");
        await supabase.auth.signOut();
        return;
      }

      setMessage("Admin access confirmed. Redirecting...");
      router.push("/admin/peptides");
      router.refresh();
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center px-4 py-8 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Admin login
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Sign in with an admin account to access the PEPT|IQ admin area.
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Email
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Password
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            required
          />
        </label>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-white shadow-sm transition ${
            isLoading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-[var(--color-accent)] hover:opacity-90"
          }`}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--color-accent)] transition hover:opacity-80"
          >
            Forgot password?
          </Link>

          <Link
            href="/login"
            className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Back to main login
          </Link>
        </div>
      </form>
    </main>
  );
}