"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const DISCLAIMER_VERSION = "v1";
const STORAGE_KEY = `peptiq_disclaimer_accepted_${DISCLAIMER_VERSION}`;

const ANONYMOUS_GATED_PUBLIC_PATHS = [
  "/home",
  "/peptides",
  "/calculator",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const ALWAYS_ALLOWED_PATHS = ["/disclaimer"];

export default function DisclaimerGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const accepted = localStorage.getItem(STORAGE_KEY) === "true";

    if (pathname === "/") {
      router.replace(accepted ? "/home" : "/disclaimer");
      return;
    }

    const isAlwaysAllowed = ALWAYS_ALLOWED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isAlwaysAllowed) {
      return;
    }

    const isAnonymousGatedPublicPath = ANONYMOUS_GATED_PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isAnonymousGatedPublicPath && !accepted) {
      router.replace("/disclaimer");
    }
  }, [pathname, router]);

  return null;
}