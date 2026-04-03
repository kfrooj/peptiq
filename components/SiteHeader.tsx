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

  function getBg(isActive: boolean) {
    return {
      backgroundColor: isActive ? "var(--color-accent)" : "transparent",
    };
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/peptiq-logo.png"
            alt="PEPTIQ logo"
            width={180}
            height={50}
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">

          {/* Public */}
          <Link
            href="/"
            className={getLinkClass(pathname === "/")}
            style={getBg(pathname === "/")}
          >
            Home
          </Link>

          <Link
            href="/calculator"
            className={getLinkClass(pathname === "/calculator")}
            style={getBg(pathname === "/calculator")}
          >
            Calculator
          </Link>

          <Link
            href="/stacks"
            className={getLinkClass(pathname.startsWith("/stacks"))}
            style={getBg(pathname.startsWith("/stacks"))}
          >
            Stacks
          </Link>

          {/* Logged-in only */}
          {isLoggedIn && (
            <>
              <Link
                href="/dashboard"
                className={getLinkClass(pathname.startsWith("/dashboard"))}
                style={getBg(pathname.startsWith("/dashboard"))}
              >
                Dashboard
              </Link>

              <Link
                href="/plans"
                className={getLinkClass(pathname.startsWith("/plans"))}
                style={getBg(pathname.startsWith("/plans"))}
              >
                Plans
              </Link>

              <Link
                href="/log-injection"
                className={getLinkClass(pathname.startsWith("/log-injection"))}
                style={getBg(pathname.startsWith("/log-injection"))}
              >
                Log
              </Link>

              <Link
                href="/wellness"
                className={getLinkClass(pathname.startsWith("/wellness"))}
                style={getBg(pathname.startsWith("/wellness"))}
              >
                Wellness
              </Link>
            </>
          )}

          {/* Admin only */}
          {isAdmin && (
            <>
              <Link
                href="/admin/peptides"
                className={getLinkClass(pathname.startsWith("/admin/peptides"))}
                style={getBg(pathname.startsWith("/admin/peptides"))}
              >
                Manage
              </Link>
            </>
          )}

          {/* Auth button */}
          <div className="ml-2">
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
          </div>
        </nav>
      </div>
    </header>
  );
}