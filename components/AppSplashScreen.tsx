"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AppSplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // small delay so it feels intentional, not flickery
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch {
        // ignore errors
      } finally {
        if (isMounted) {
          setVisible(false);
        }
      }
    }

    init();

    // 🔑 HARD FAILSAFE (prevents getting stuck forever)
    const timeout = setTimeout(() => {
      if (isMounted) {
        setVisible(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        {/* ✅ REMOVE old logo image */}
        {/* You can keep or remove branding text below */}

        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          PEPTIQ
        </h1>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Loading...
        </p>

        <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--color-border)] mx-auto">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        </div>
      </div>
    </div>
  );
}