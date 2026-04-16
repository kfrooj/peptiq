import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "@/components/dashboard/DashboardContent";

function GuestDashboard() {
  return (
    <main className="page-fade-in min-h-screen bg-[var(--color-background)]">
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="space-y-10">
          <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <div>
              <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-muted)] shadow-sm">
                • Research • planning • tracking • adherence •
              </span>

              <h1 className="mt-6 max-w-3xl text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
                Track your peptide protocols with clarity.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base lg:text-lg">
                PEPT|IQ brings together planning, injection tracking, reminders,
                and adherence insights — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Start Tracking
                </Link>

                <Link
                  href="/peptides"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] shadow-sm transition hover:bg-[var(--color-surface-muted)]"
                >
                  Explore Peptides
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                  What you’ll unlock
                </h2>

                <div className="mt-5 grid gap-3">
                  <FeatureItem
                    title="Track injections"
                    description="Log activity and keep your history organised."
                  />
                  <FeatureItem
                    title="Smart reminders"
                    description="Never miss a scheduled protocol again."
                  />
                  <FeatureItem
                    title="Adherence insights"
                    description="See how consistent you are over time."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              Your dashboard, at a glance
            </h2>

            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Once you’re set up, you’ll see your plans, reminders, and progress
              here.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 opacity-60">
              <PreviewCard title="Active Plans" value="—" />
              <PreviewCard title="Missed Reminders" value="—" />
              <PreviewCard title="Last Injection" value="—" />
              <PreviewCard title="Next Reminder" value="—" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <GuestDashboard />;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("disclaimer_accepted")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.disclaimer_accepted) {
    redirect("/disclaimer");
  }

  return <DashboardContent />;
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
    </div>
  );
}

function PreviewCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs uppercase text-[var(--color-muted)]">{title}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}