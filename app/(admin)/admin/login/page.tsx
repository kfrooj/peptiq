"use client";

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
    const trimmedEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          const lowerMessage = error.message.toLowerCase();

          if (
            lowerMessage.includes("invalid") ||
            lowerMessage.includes("credentials")
          ) {
            setError("Invalid email or password.");
          } else {
            setError(error.message);
          }

          setIsLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Login failed.");
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin/peptides");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          const lowerMessage = error.message.toLowerCase();

          if (
            lowerMessage.includes("already") ||
            lowerMessage.includes("exists")
          ) {
            setError("An account with this email already exists. Try logging in.");
          } else {
            setError(error.message);
          }

          setIsLoading(false);
          return;
        }

        setMessage(
          "Account created. Check your email if confirmation is required, then log in."
        );
        setMode("login");
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

        {error ? (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        ) : null}

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
      </form>
    </main>
  );
}