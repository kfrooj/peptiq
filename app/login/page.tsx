"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Your email or password is incorrect.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  if (lower.includes("user already registered") || lower.includes("already")) {
    return "An account with this email already exists.";
  }

  if (lower.includes("password")) {
    return "Please check your password and try again.";
  }

  if (lower.includes("signup")) {
    return "We couldn’t create your account. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

function getCallbackErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "missing_auth_code":
      return "This sign-in link is incomplete or has expired.";
    case "auth_callback_failed":
      return "We couldn’t verify your sign-in link. Please try again.";
    default:
      return null;
  }
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "signup") {
      setMode("signup");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    const callbackError = getCallbackErrorMessage(searchParams.get("error"));
    if (callbackError) {
      setError(callbackError);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setMessage(null);
    setIsLoading(true);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
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

        if (profile?.role === "admin") {
          router.push("/admin/peptides");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
        return;
      }

      if (password.length < 8) {
        setError("Use at least 8 characters for your password.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setError(getFriendlyAuthError(error.message));
        return;
      }

      if (!data.user) {
        setError("Account could not be created.");
        return;
      }

      const emailConfirmed = Boolean(data.user.email_confirmed_at);

      if (!emailConfirmed) {
        setMessage(
          "Account created. Check your email to confirm your address before signing in."
        );
        setMode("login");
      } else {
        setMessage("Account created. You can now sign in.");
        setMode("login");
      }

      setEmail(normalizedEmail);
      setPassword("");
    } catch (err) {
      console.error("Auth form error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center px-4 py-8 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {isLogin
              ? "Sign in to access your plans, reminders, and tracking."
              : "Create an account to start tracking plans, reminders, and adherence in PEPT|IQ."}
          </p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
              router.replace("/login");
            }}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isLogin
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text)]"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
              router.replace("/login?mode=signup");
            }}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              !isLogin
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text)]"
            }`}
          >
            Sign up
          </button>
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

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
            Password
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            required
          />
        </label>

        {!isLogin ? (
          <p className="mb-4 text-xs leading-5 text-[var(--color-muted)]">
            Use at least 8 characters for your password.
          </p>
        ) : null}

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
          {isLoading
            ? isLogin
              ? "Logging in..."
              : "Creating account..."
            : isLogin
              ? "Sign in"
              : "Create account"}
        </button>

        <div className="mt-4 flex flex-col items-center gap-3">
          {isLogin ? (
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--color-accent)] transition hover:opacity-80"
            >
              Forgot password?
            </Link>
          ) : null}

          <Link
            href="/"
            className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Back to home
          </Link>
        </div>
      </form>
    </main>
  );
}