import Link from "next/link";

export const metadata = {
  title: "Account Deletion | PEPT|IQ",
  description:
    "Learn how to delete your PEPT|IQ account and what data is removed.",
};

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            PEPT|IQ Support
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Account deletion
          </h1>

          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            PEPT|IQ allows you to permanently delete your account and associated
            personal data. This page explains how to do that and what happens
            when your account is removed.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Delete your account in the app
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              If you can still access your PEPT|IQ account, open{" "}
              <span className="font-medium text-[var(--color-text)]">
                Profile
              </span>{" "}
              and use the{" "}
              <span className="font-medium text-[var(--color-text)]">
                Delete account
              </span>{" "}
              option in the danger zone. You will be asked to confirm before the
              deletion is triggered.
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Can’t access the app?
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              If you no longer have access to your account or have uninstalled
              the app, you can request deletion by contacting support.
            </p>

            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Deletion request contact
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Email:{" "}
                <a
                  href="mailto:support@peptiq.uk?subject=PEPT%7CIQ%20Account%20Deletion%20Request"
                  className="font-medium text-[var(--color-accent)] underline underline-offset-4"
                >
                  support@peptiq.uk
                </a>
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Please send your request from the email address linked to your
                PEPT|IQ account, or include enough information for us to verify
                ownership safely.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              What is deleted
            </h2>
            <div className="mt-3 grid gap-2">
              <InfoRow text="Profile information linked to your account" />
              <InfoRow text="Injection plans and reminders" />
              <InfoRow text="Injection logs and wellness history" />
              <InfoRow text="Saved stacks and favourites" />
              <InfoRow text="Notification preferences tied to your account" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              What happens after deletion
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Once your account deletion is completed, your PEPT|IQ account is
              permanently removed and future reminders or account-linked
              notifications should no longer be sent. This action cannot be
              undone.
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Need more information?
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
              >
                Back to profile
              </Link>

              <Link
                href="/privacy"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                View privacy policy
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]">
      {text}
    </div>
  );
}