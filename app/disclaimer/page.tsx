"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DISCLAIMER_VERSION = "v1";

function getStorageKey(version: string) {
  return `peptiq_disclaimer_accepted_${version}`;
}

export default function DisclaimerPage() {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(DISCLAIMER_VERSION), []);

  const [loading, setLoading] = useState(true);
  const [checkedReferenceOnly, setCheckedReferenceOnly] = useState(false);
  const [checkedNotMedicalAdvice, setCheckedNotMedicalAdvice] = useState(false);
  const [checkedResponsibleUse, setCheckedResponsibleUse] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue =
    checkedReferenceOnly &&
    checkedNotMedicalAdvice &&
    checkedResponsibleUse;

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      const localAccepted = localStorage.getItem(storageKey) === "true";

      try {
        const res = await fetch("/api/disclaimer/status", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!isMounted) return;

        // Anonymous visitor
        if (!data.authenticated) {
          if (localAccepted) {
            router.replace("/home");
            return;
          }

          setLoading(false);
          return;
        }

        // Logged-in user with DB acceptance
        if (data.accepted) {
          localStorage.setItem(storageKey, "true");
          router.replace("/home");
          return;
        }

        // Logged-in user without DB acceptance
        setLoading(false);
      } catch {
        if (!isMounted) return;

        if (localAccepted) {
          router.replace("/home");
          return;
        }

        setLoading(false);
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [router, storageKey]);

  async function handleContinue() {
    if (!canContinue) {
      setError("Please confirm all statements before continuing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    localStorage.setItem(storageKey, "true");

    try {
      await fetch("/api/disclaimer/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: DISCLAIMER_VERSION,
        }),
      });

      router.replace("/home");
    } catch {
      router.replace("/home");
    }
  }

  function handleExit() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace("/home");
  }

 if (loading) {
  return (
   <main className="page-fade-in min-h-screen bg-gradient-to-b from-white to-[var(--color-surface-muted)] px-4 py-10">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center text-center">
        <div className="relative h-16 w-16">
          <Image
            src="/peptiq-logo.png"
            alt="PEPTIQ logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)]">
          PEPTIQ
        </h1>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Checking access…
        </p>

        <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        </div>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[var(--color-surface-muted)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative h-16 w-16">
            <Image
              src="/peptiq-logo.png"
              alt="PEPTIQ logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            PEPTIQ
          </h1>

          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Research & Reference Platform
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Reference Notice
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Before using the app, please confirm that you understand the purpose
            of PEPTIQ and the limitations of the information provided.
          </p>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              PEPTIQ is a research and reference app. Information provided does
              not constitute medical advice, diagnosis, or treatment. Content may
              not reflect verified clinical guidance and should not be relied
              upon for health decisions.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {[
              {
                checked: checkedReferenceOnly,
                set: setCheckedReferenceOnly,
                text: "I understand this is a research/reference tool only",
              },
              {
                checked: checkedNotMedicalAdvice,
                set: setCheckedNotMedicalAdvice,
                text: "I understand this is not medical advice",
              },
              {
                checked: checkedResponsibleUse,
                set: setCheckedResponsibleUse,
                text: "I accept responsibility for how I use this information",
              },
            ].map((item, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] p-4"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.set(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm leading-6 text-[var(--color-text)]">
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
  onClick={handleContinue}
  disabled={!canContinue || isSubmitting}
  className={`mt-6 w-full rounded-xl py-3 text-sm font-medium text-white transition ${
    canContinue && !isSubmitting
      ? "bg-[var(--color-accent)] hover:opacity-90"
      : "bg-gray-400"
  }`}
>
  {isSubmitting ? "Saving and continuing..." : "I understand"}
</button>

<p className="mt-3 text-center text-xs text-[var(--color-muted)]">
  {isSubmitting
    ? "Saving your acknowledgement…"
    : "You’ll only need to do this again if the disclaimer changes."}
</p>

          <button
            type="button"
            onClick={handleExit}
            className="mt-3 block w-full text-center text-sm text-[var(--color-muted)] underline"
          >
            Exit
          </button>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Version {DISCLAIMER_VERSION}
          </p>
        </div>
      </div>
    </main>
  );
}