"use client";

import Image from "next/image";
import Link from "next/link";
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
    const accepted = localStorage.getItem(storageKey) === "true";

    if (!accepted) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/session-check", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        router.replace(data.authenticated ? "/dashboard" : "/login");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router, storageKey]);

  async function handleContinue() {
    if (!canContinue) {
      setError("Please confirm all statements before continuing.");
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem(storageKey, "true");

    try {
      const res = await fetch("/api/auth/session-check", {
        cache: "no-store",
      });

      const data = await res.json();
      router.replace(data.authenticated ? "/dashboard" : "/login");
    } catch {
      router.replace("/login");
    }
  }

 if (loading) {
  return null;
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[var(--color-surface-muted)] px-4 py-10">
      <div className="mx-auto max-w-md">

        {/* LOGO */}
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

        {/* CARD */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            Reference Notice
          </h2>

          <p className="mt-2 text-sm text-[var(--color-muted)] leading-6">
            Before using the app, please confirm that you understand the purpose
            of PEPTIQ and the limitations of the information provided.
          </p>

          {/* WARNING */}
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900 leading-6">
              PEPTIQ is a research and reference app. Information provided does
              not constitute medical advice, diagnosis, or treatment. Content may
              not reflect verified clinical guidance and should not be relied
              upon for health decisions.
            </p>
          </div>

          {/* CHECKBOXES */}
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
                <span className="text-sm text-[var(--color-text)] leading-6">
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={!canContinue || isSubmitting}
            className={`mt-6 w-full rounded-xl py-3 text-sm font-medium text-white transition ${
              canContinue
                ? "bg-[var(--color-accent)] hover:opacity-90"
                : "bg-gray-400"
            }`}
          >
            {isSubmitting ? "Continuing..." : "I understand"}
          </button>

          <Link
            href="/"
            className="mt-3 block text-center text-sm text-[var(--color-muted)] underline"
          >
            Exit
          </Link>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Version {DISCLAIMER_VERSION}
          </p>
        </div>
      </div>
    </main>
  );
}