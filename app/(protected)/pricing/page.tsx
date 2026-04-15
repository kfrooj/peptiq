import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UpgradeToProButton from "@/components/billing/UpgradeToProButton";
import { getEffectivePlanTierForUser } from "@/lib/billing/getEffectivePlanTier";

type PlanTier = "free" | "pro";

type BillingProfile = {
  plan_tier?: string | null;
  subscription_status?: string | null;
};

function FeatureRow({
  label,
  freeValue,
  proValue,
}: {
  label: string;
  freeValue: string;
  proValue: string;
}) {
  return (
    <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3 sm:px-4">
      <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
      <p className="text-sm text-[var(--color-muted)]">{freeValue}</p>
      <p className="text-sm font-medium text-[var(--color-text)]">{proValue}</p>
    </div>
  );
}

function PlanCard({
  name,
  badge,
  description,
  price,
  billingNote,
  features,
  highlighted = false,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  customPrimaryCta,
}: {
  name: string;
  badge?: string;
  description: string;
  price: string;
  billingNote?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  customPrimaryCta?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl sm:p-5 ${
        highlighted
          ? "border-[var(--color-accent)] bg-white"
          : "border-[var(--color-border)] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            {name}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {description}
          </p>
        </div>

        {badge ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              highlighted
                ? "bg-blue-50 text-[var(--color-accent)]"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-3xl font-semibold leading-none text-[var(--color-text)]">
          {price}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {billingNote ??
            "Billing setup comes next. This page is ready for the upgrade flow."}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            {feature}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {customPrimaryCta ? (
          customPrimaryCta
        ) : ctaLabel && ctaHref ? (
          <Link
            href={ctaHref}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              highlighted
                ? "bg-[var(--color-text)] text-white hover:opacity-90"
                : "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
            }`}
          >
            {ctaLabel}
          </Link>
        ) : null}

        {secondaryLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] sm:text-base">
        {question}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">
        {answer}
      </p>
    </div>
  );
}

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData, error: profileError } = user
    ? await supabase
        .from("profiles")
        .select("plan_tier, subscription_status")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  if (profileError) {
    throw new Error(profileError.message);
  }

  const planTier: PlanTier = getEffectivePlanTierForUser(
    user?.email,
    (profileData ?? undefined) as BillingProfile | undefined
  );
  const isPro = planTier === "pro";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Pricing
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Choose the plan that fits your tracking
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)] sm:text-base">
              Start free, keep the essentials, and upgrade when you want
              unlimited plans, deeper history, and more advanced tracking tools.
            </p>
          </div>

       {/*   <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Mobile-first
           </span>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Simple v1 pricing
           </span>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
             One paid tier
            </span>
          </div> */}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PlanCard
            name="Free"
            badge={!isPro ? "Current plan" : undefined}
            description="Great for getting started with PEPTIQ."
            price="£0"
            billingNote="Includes the core PEPTIQ tracking experience."
            features={[
              "Up to 2 active plans",
              "30-day history",
              "Basic logging and calculator",
              "Basic reminders",
              "Peptide library access",
            ]}
            ctaLabel={!isPro ? "Current plan" : "View Profile"}
            ctaHref="/profile"
            secondaryLabel="Back to Profile"
            secondaryHref="/profile"
          />

          <PlanCard
            name="Pro"
            badge={isPro ? "Current plan" : "Recommended"}
            description="For ongoing tracking, deeper insight, and less friction."
            price={isPro ? "Included" : "Monthly subscription"}
            billingNote={
              isPro
                ? "Your account already has Pro access."
                : "Checkout is handled securely with Stripe."
            }
            features={[
              "Unlimited active plans",
              "Full history access",
              "Advanced insights and trends",
              "Advanced reminder options",
              "Saved workflows and exports",
            ]}
            highlighted
            customPrimaryCta={
            isPro ? (
  <Link
  href="/manage-subscription"
  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
>
  Manage subscription
</Link>
) : (
                <UpgradeToProButton />
              )
            }
            secondaryLabel="See your profile"
            secondaryHref="/profile"
          />
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              Compare plans
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Keep the essentials on Free, or unlock more depth with Pro.
            </p>
          </div>

          <div className="mb-2 grid grid-cols-[1.1fr_0.9fr_0.9fr] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            <span>Feature</span>
            <span>Free</span>
            <span>Pro</span>
          </div>

          <div className="grid gap-2">
            <FeatureRow
              label="Active plans"
              freeValue="Up to 2"
              proValue="Unlimited"
            />
            <FeatureRow
              label="History"
              freeValue="30 days"
              proValue="Full access"
            />
            <FeatureRow
              label="Adherence insights"
              freeValue="Basic"
              proValue="Advanced"
            />
            <FeatureRow
              label="Reminders"
              freeValue="Standard"
              proValue="Advanced"
            />
            <FeatureRow label="Exports" freeValue="No" proValue="Yes" />
            <FeatureRow
              label="Saved workflows"
              freeValue="No"
              proValue="Yes"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              Why upgrade
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Pro is designed for people using PEPTIQ as an ongoing tool, not
              just a reference app.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Manage more than two plans
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Keep multiple active protocols without having to archive older
                  ones first.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  See the bigger picture
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Unlock longer history and better adherence trends over time.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Reduce tracking friction
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Use saved workflows, richer reminders, and fewer repeated setup
                  steps.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Export and review
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Keep a clearer record when you want to look back or share your
                  tracking history.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                Current account
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {user?.email ?? "Signed in"}
              </p>

              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  Current plan
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-semibold text-[var(--color-text)]">
                    {isPro ? "Pro" : "Free"}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPro
                        ? "bg-blue-50 text-[var(--color-accent)]"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isPro ? "Pro" : "Free"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                >
                  Back to Profile
                </Link>

                <Link
                  href="/plans"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                >
                  Back to Plans
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                Questions
              </h2>

              <div className="mt-4 space-y-3">
                <FAQItem
                  question="Can I use PEPTIQ for free?"
                  answer="Yes. Free keeps the core experience useful, including logging, the calculator, and up to 2 active plans."
                />
                <FAQItem
                  question="What happens when Pro launches?"
                  answer="The upgrade path on this page now starts secure Stripe checkout. Subscription status is then synced back into your PEPTIQ account."
                />
                <FAQItem
                  question="Will I be able to cancel?"
                  answer="Yes. The Pro flow is being designed around simple subscription management and cancellation."
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}