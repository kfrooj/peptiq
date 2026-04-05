"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
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
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Login failed. Please try again.");
          setIsLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setError("Could not load user profile.");
          setIsLoading(false);
          return;
        }

        if (profile?.role === "admin") {
          router.push("/admin/peptides");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("already")) {
            setError("An account with this email already exists.");
          } else {
            setError(error.message);
          }

          setIsLoading(false);
          return;
        }

        if (!data.user) {
          setError("Account could not be created.");
          setIsLoading(false);
          return;
        }

        const { error: profileInsertError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            name: null,
            role: "user",
            email_reminders: true,
            missed_reminder_alerts: true,
          });

        if (profileInsertError) {
          setError("Account created, but profile setup failed.");
          setIsLoading(false);
          return;
        }

        setMessage("Account created successfully. You can now log in.");
        setMode("login");
        setEmail(normalizedEmail);
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-md items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">
          {mode === "login" ? "Login" : "Create account"}
        </h1>

        <div className="mb-6 flex rounded-xl bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "login"
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
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text)]"
            }`}
          >
            Sign up
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </label>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        {message ? (
          <p className="mb-3 text-sm text-green-600">{message}</p>
        ) : null}

        <button
          disabled={isLoading}
          className={`w-full rounded-xl px-4 py-2 text-white shadow-sm transition ${
            isLoading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-[var(--color-accent)] hover:opacity-90"
          }`}
        >
          {isLoading
            ? mode === "login"
              ? "Logging in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>

        {mode === "login" ? (
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 transition hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>
        ) : null}
      </form>
    </main>
  );
}