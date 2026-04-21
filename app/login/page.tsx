"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

  if (lower.includes("known to be weak") || lower.includes("easy to guess")) {
    return "That password is too common or easy to guess. Try something more unique.";
  }

  if (
    lower.includes("password should be at least") ||
    lower.includes("at least 8 characters")
  ) {
    return "Your password must be at least 8 characters long.";
  }

  if (
    lower.includes("password") &&
    (lower.includes("weak") ||
      lower.includes("secure") ||
      lower.includes("strength") ||
      lower.includes("policy") ||
      lower.includes("character"))
  ) {
    return "Your password does not meet the security requirements. Try a longer password with a mix of letters, numbers, and symbols.";
  }

  if (lower.includes("rate limit")) {
    return "Too many attempts in a short time. Please wait a minute and try again.";
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

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
}

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      label: "Enter a password",
      score: 0,
      barClass: "bg-slate-200",
      textClass: "text-[var(--color-muted)]",
    };
  }

  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 1) {
    return {
      label: "Needs work",
      score,
      barClass: "bg-rose-500",
      textClass: "text-rose-700",
    };
  }

  if (score <= 3) {
    return {
      label: "Good start",
      score,
      barClass: "bg-amber-500",
      textClass: "text-amber-700",
    };
  }

  return {
    label: "Meets basic rules",
    score,
    barClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  };
}

function PasswordRequirement({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <li
      className={`flex items-center gap-2 ${
        met ? "text-emerald-700" : "text-[var(--color-muted)]"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          met
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {met ? "✓" : "•"}
      </span>
      <span>{label}</span>
    </li>
  );
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
    const deleted = searchParams.get("deleted");

    if (callbackError) {
      setError(callbackError);
      return;
    }

    if (deleted === "account") {
      setError(null);
      setMessage("Your account has been deleted successfully.");
    }
  }, [searchParams]);

  const isLogin = mode === "login";
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

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
          console.error("Profile load error after login:", profileError);
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
        setError("Your password must be at least 8 characters long.");
        return;
      }

      if (
        !passwordChecks.hasLetter ||
        !passwordChecks.hasNumber ||
        !passwordChecks.hasSymbol
      ) {
        setError(
          "Use at least 8 characters with a mix of letters, numbers, and symbols."
        );
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
        console.error("Signup error object:", error);
        console.error("Signup error message:", error.message);
        setError(getFriendlyAuthError(error.message));
        return;
      }

      if (!data.user) {
        setError("Account could not be created.");
        return;
      }

      const looksLikeExistingAccount =
        Array.isArray(data.user.identities) && data.user.identities.length === 0;

      if (looksLikeExistingAccount) {
        setMessage(
          "This email may already be registered. Try signing in, checking your inbox for a confirmation email, or resetting your password."
        );
        setMode("login");
        setPassword("");
        router.replace("/login");
        return;
      }

      const emailConfirmed = Boolean(data.user.email_confirmed_at);

      if (!emailConfirmed) {
        setMessage(
          "Account created. Check your inbox and spam folder for a confirmation email. It can take a minute to arrive."
        );
        setMode("login");
        router.replace("/login");
      } else {
        setMessage("Account created. You can now sign in.");
        setMode("login");
        router.replace("/login");
      }

      setEmail(normalizedEmail);
      setPassword("");
    } catch (err) {
      console.error("Auth form error:", err);

      if (err instanceof Error) {
        console.error("Auth form error message:", err.message);
      }

      setError(
        mode === "signup"
          ? "We couldn’t complete sign up right now. Please try again, or check whether this email has already been used."
          : "Something went wrong. Please try again."
      );
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
          <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[var(--color-text)]">
                Password guidance
              </p>
              <p className={`text-xs font-semibold ${passwordStrength.textClass}`}>
                {passwordStrength.label}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
              Use at least 8 characters with letters, numbers, and symbols. Avoid common or easy-to-guess passwords.
            </p>

            <ul className="mt-3 space-y-2 text-xs">
              <PasswordRequirement
                met={passwordChecks.minLength}
                label="At least 8 characters"
              />
              <PasswordRequirement
                met={passwordChecks.hasLetter}
                label="Contains a letter"
              />
              <PasswordRequirement
                met={passwordChecks.hasNumber}
                label="Contains a number"
              />
              <PasswordRequirement
                met={passwordChecks.hasSymbol}
                label="Contains a symbol"
              />
            </ul>

            <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
              Tip: common patterns and well-known passwords may still be rejected even if they meet the basic rules.
            </p>
          </div>
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
            href="/account-deletion"
            className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Account deletion
          </Link>

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