import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import AdminRoleToggleButton from "@/components/AdminRoleToggleButton";

type ProfileRow = {
  role: string | null;
};

type SearchParams = Promise<{
  email?: string;
  error?: string;
}>;

type AuthUserRow = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: {
    [key: string]: unknown;
  } | null;
};

type AppProfileRow = {
  id: string;
  name: string | null;
  role: string | null;
  created_at: string | null;
  email_reminders: boolean | null;
  missed_reminder_alerts: boolean | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserByEmail(email: string): Promise<AuthUserRow | null> {
  const admin = createSupabaseAdminClient();

  const { data: usersData, error } = await admin.auth.admin.listUsers();

  if (error) {
    throw new Error(error.message);
  }

  return (
    ((usersData.users as AuthUserRow[]) || []).find(
      (candidate) => candidate.email?.toLowerCase() === email
    ) ?? null
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const currentProfile = profile as ProfileRow | null;

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const email = params.email?.trim().toLowerCase() ?? "";
  const error = params.error ? decodeURIComponent(params.error) : "";

  let matchedUser: AuthUserRow | null = null;
  let matchedProfile: AppProfileRow | null = null;

  if (email) {
    matchedUser = await findAuthUserByEmail(email);

    if (matchedUser) {
      const { data: appProfile, error: appProfileError } = await supabase
        .from("profiles")
        .select(
          "id, name, role, created_at, email_reminders, missed_reminder_alerts"
        )
        .eq("id", matchedUser.id)
        .maybeSingle();

      if (appProfileError) {
        throw new Error(appProfileError.message);
      }

      matchedProfile = appProfile as AppProfileRow | null;
    }
  }

  const resetPasswordHref = matchedUser?.email
    ? `/admin/reset-password?email=${encodeURIComponent(matchedUser.email)}`
    : email
      ? `/admin/reset-password?email=${encodeURIComponent(email)}`
      : "/admin/reset-password";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-[var(--color-accent)]">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--color-text)]">
          User Lookup
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Search for a user by email and review their basic account details.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <form
          action="/admin/users"
          method="get"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            name="email"
            defaultValue={email}
            required
            placeholder="user@example.com"
            className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Search User
          </button>

          <Link
            href="/admin"
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Back to Admin Hub
          </Link>
        </form>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>

      {email ? (
        <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          {!matchedUser ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
              No user found for{" "}
              <span className="font-medium text-[var(--color-text)]">
                {email}
              </span>
              .
            </div>
          ) : (
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                  Auth Account
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoCard label="User ID" value={matchedUser.id} />
                  <InfoCard label="Email" value={matchedUser.email ?? "—"} />
                  <InfoCard
                    label="Created"
                    value={formatDateTime(matchedUser.created_at)}
                  />
                  <InfoCard
                    label="Last Sign In"
                    value={formatDateTime(matchedUser.last_sign_in_at)}
                  />
                  <InfoCard
                    label="Email Confirmed"
                    value={matchedUser.email_confirmed_at ? "Yes" : "No"}
                  />
                  <InfoCard
                    label="Display Name"
                    value={
                      typeof matchedUser.user_metadata?.name === "string"
                        ? matchedUser.user_metadata.name
                        : "—"
                    }
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                  App Profile
                </h2>

                {!matchedProfile ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
  No app profile exists for this user yet. You can still promote them to admin,
  and a profile row will be created automatically if needed.
</div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InfoCard label="Name" value={matchedProfile.name ?? "—"} />
                    <InfoCard label="Role" value={matchedProfile.role ?? "—"} />
                    <InfoCard
                      label="Profile Created"
                      value={formatDateTime(matchedProfile.created_at)}
                    />
                    <InfoCard
                      label="Email Reminders"
                      value={
                        matchedProfile.email_reminders ? "Enabled" : "Disabled"
                      }
                    />
                    <InfoCard
                      label="Missed Reminder Alerts"
                      value={
                        matchedProfile.missed_reminder_alerts
                          ? "Enabled"
                          : "Disabled"
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                  Support Actions
                </h2>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={resetPasswordHref}
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
                  >
                    Reset Password
                  </Link>

                 <AdminRoleToggleButton
  userId={matchedUser.id}
  isAdmin={matchedProfile?.role === "admin"}
  isSelf={matchedUser.id === user.id}
/>

                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]"
                  >
                    View Activity (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}