"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

function FeedbackMessage({ state }: { state: ActionState }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state.status === "idle") return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [state]);

  if (!visible || state.status === "idle" || !state.message) return null;

  const isSuccess = state.status === "success";

  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      <span className="mt-0.5 shrink-0">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
      </span>
      <span>{state.message}</span>
    </div>
  );
}

export function UpdateNameForm({
  defaultName,
  action,
}: {
  defaultName: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
    >
      <label
        htmlFor="name"
        className="block text-sm text-[var(--color-muted)]"
      >
        Name
      </label>
      <input
        id="name"
        type="text"
        name="name"
        defaultValue={defaultName}
        placeholder="Enter your name"
        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save"}
      </button>

      <FeedbackMessage state={state} />
    </form>
  );
}

export function UpdateNotificationsForm({
  defaultEmailReminders,
  defaultMissedReminderAlerts,
  action,
}: {
  defaultEmailReminders: boolean;
  defaultMissedReminderAlerts: boolean;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <div>
         <p className="font-medium text-[var(--color-text)]">
  Plan reminder emails
</p>
<p className="mt-1 text-sm text-[var(--color-muted)]">
  Receive scheduled reminder emails for your active injection plans.
</p>
        </div>
        <input
          type="checkbox"
          name="emailReminders"
          defaultChecked={defaultEmailReminders}
          className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
        />
      </label>

      <label className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <div>
         <p className="font-medium text-[var(--color-text)]">
  Missed injection alerts
</p>
<p className="mt-1 text-sm text-[var(--color-muted)]">
  Get alerted when a scheduled injection is missed.
</p>
        </div>
        <input
          type="checkbox"
          name="missedReminderAlerts"
          defaultChecked={defaultMissedReminderAlerts}
          className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Preferences"}
      </button>

      <FeedbackMessage state={state} />
    </form>
  );
}

export function ChangePasswordForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setPassword("");
      setConfirmPassword("");
      setClientError("");
    }
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!password || !confirmPassword) {
      setClientError("Please complete both password fields.");
      event.preventDefault();
      return;
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      event.preventDefault();
      return;
    }

    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      event.preventDefault();
      return;
    }

    setClientError("");
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="mt-4 space-y-4"
    >
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--color-text)]"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a new password"
          className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-[var(--color-text)]"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
          className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted)]">
        Use at least 8 characters. You’ll receive a security email when your
        password is changed.
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Change Password"}
      </button>

      {clientError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {clientError}
        </div>
      ) : null}

      <FeedbackMessage state={state} />
    </form>
  );
}

export function RemoveFavoriteButton({
  itemId,
  itemName,
  itemType,
  action,
}: {
  itemId: string;
  itemName: string;
  itemType: "peptide" | "stack";
  action: (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className="mt-3">
      <form action={formAction}>
        <input
          type="hidden"
          name={itemType === "peptide" ? "peptideId" : "stackId"}
          value={itemId}
        />
        <input type="hidden" name="itemName" value={itemName} />

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Removing..." : "Remove"}
        </button>
      </form>

      <FeedbackMessage state={state} />
    </div>
  );
}

export function InviteFriendCard({
  shareUrl,
}: {
  shareUrl: string;
}) {
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: "",
  });

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState({
        status: "success",
        message: "Invite link copied to clipboard.",
      });
    } catch {
      setState({
        status: "error",
        message: "Could not copy the invite link.",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div>
        <p className="font-medium text-[var(--color-text)]">Invite a friend</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Share PEPTIQ with someone using your public link.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Copy invite link
        </button>

        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          Open public page
        </a>
      </div>

      <FeedbackMessage state={state} />
    </div>
  );
}