"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  user: any;
  isAdmin: boolean;
};

export default function SiteHeader({ user, isAdmin }: Props) {
  const pathname = usePathname();
  const isLoggedIn = !!user;

  function getLinkClass(isActive: boolean) {
    return isActive
      ? "rounded-full px-4 py-2 text-sm font-medium text-white"
      : "rounded-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white";
  }

  const isHomeActive = pathname === "/";
  const isCalculatorActive = pathname === "/calculator";
  const isStacksActive = pathname.startsWith("/stacks");
  const isDashboardActive = pathname.startsWith("/dashboard");
  const isAdminActive = pathname === "/admin/login";
  const isManagePeptidesActive = pathname.startsWith("/admin/peptides");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/peptiq-logo.png"
            alt="PEPTIQ logo"
            width={180}
            height={50}
            priority
          />
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={getLinkClass(isHomeActive)}
            style={{
              backgroundColor: isHomeActive
                ? "var(--color-accent)"
                : "transparent",
            }}
          >
            Home
          </Link>

          <Link
            href="/calculator"
            className={getLinkClass(isCalculatorActive)}
            style={{
              backgroundColor: isCalculatorActive
                ? "var(--color-accent)"
                : "transparent",
            }}
          >
            Calculator
          </Link>

          <Link
            href="/stacks"
            className={getLinkClass(isStacksActive)}
            style={{
              backgroundColor: isStacksActive
                ? "var(--color-accent)"
                : "transparent",
            }}
          >
            Stacks
          </Link>

          {isLoggedIn && (
            <Link
              href="/dashboard"
              className={getLinkClass(isDashboardActive)}
              style={{
                backgroundColor: isDashboardActive
                  ? "var(--color-accent)"
                  : "transparent",
              }}
            >
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                href="/admin/login"
                className={getLinkClass(isAdminActive)}
                style={{
                  backgroundColor: isAdminActive
                    ? "var(--color-accent)"
                    : "transparent",
                }}
              >
                Admin
              </Link>

              <Link
                href="/admin/peptides"
                className={getLinkClass(isManagePeptidesActive)}
                style={{
                  backgroundColor: isManagePeptidesActive
                    ? "var(--color-accent)"
                    : "transparent",
                }}
              >
                Manage
              </Link>
            </>
          )}

          {isLoggedIn ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}