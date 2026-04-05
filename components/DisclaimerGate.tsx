"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const DISCLAIMER_VERSION = "v1";
const STORAGE_KEY = `peptiq_disclaimer_accepted_${DISCLAIMER_VERSION}`;

const ALLOWED_PATHS = [
  "/",
  "/disclaimer",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export default function DisclaimerGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const isAllowed = ALLOWED_PATHS.some(
      (allowedPath) =>
        pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)
    );

    if (isAllowed) return;

    const accepted = localStorage.getItem(STORAGE_KEY) === "true";

    if (!accepted) {
      router.replace("/disclaimer");
    }
  }, [pathname, router]);

  return null;
}