import Link from "next/link";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

function getFriendlyErrorMessage(error?: string) {
  if (!error) return null;

  if (error === "missing-email") {
    return "Please enter your email address.";
  }

  if (error === "invalid-email") {
    return "Please enter a valid email address.";
  }

  if (error === "send-failed") {
    return "We could not send a reset link right now. Please try again.";
  }

  return "We could not send a reset link right now. Please try again.";
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const success = params?.success;
  const error = params?.error;

  const successMessage =
    success === "check-email"
      ? "If an account exists for this email, we’ve sent a password reset link."
      : null;

  const errorMessage = getFriendlyErrorMessage(error);

  return (
    <main className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:rounded-3xl sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Forgot password
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Enter your email address and we’ll send you a PEPT|IQ password reset link.
          </p>
        </div>

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <form action="/forgot-password/send" method="post" className="mt-6">
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Email
            </span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </label>

          <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
            If an account exists for this email, we’ll send a reset link.
          </p>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Send reset link
          </button>
        </form>

        <div className="mt-4">
          <Link
            href="/login"
            className="text-sm text-[var(--color-accent)] transition hover:opacity-80"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}