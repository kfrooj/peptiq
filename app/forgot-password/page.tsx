import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Enter your email address and we’ll send you a password reset link.
        </p>

        <form action="/forgot-password/send" method="post" className="mt-6">
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Send Reset Link
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}