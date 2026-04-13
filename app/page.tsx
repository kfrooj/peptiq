"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DISCLAIMER_VERSION = "v1";
const STORAGE_KEY = `peptiq_disclaimer_accepted_${DISCLAIMER_VERSION}`;

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY) === "true";
    router.replace(accepted ? "/home" : "/disclaimer");
  }, [router]);

  return (
   <main className="page-fade-in min-h-screen bg-[var(--color-background)]">
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
          Loading your workspace…
        </p>

        <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        </div>
      </div>
    </main>
  );
}