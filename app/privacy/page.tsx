export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-[var(--color-text)]">
        Privacy Policy
      </h1>

      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Effective date: [Add date]
      </p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-[var(--color-text)]">
        <section>
          <h2 className="font-semibold">1. Information We Collect</h2>
          <p>
            We collect account information (email, name), usage data (logs,
            plans, preferences), and limited technical data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. How We Use Your Information</h2>
          <p>
            Your data is used to operate the app, store your information, and
            provide features such as reminders.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Data Storage</h2>
          <p>
            Data is stored securely using Supabase infrastructure.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Account Deletion</h2>
          <p>
            You can delete your account from the profile page. This permanently
            removes all associated data and cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Contact</h2>
          <p>support@peptiq.uk</p>
        </section>
      </div>
    </main>
  );
}