"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type HeaderUser = {
  id: string;
  email?: string | null;
} | null;

type Props = {
  user: HeaderUser;
  isAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({ user, isAdmin }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const publicNav: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/peptides", label: "Peptides" },
    { href: "/calculator", label: "Calculator" },
  ];

  const loggedInNav: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/plans", label: "Plans" },
    { href: "/log-injection", label: "Log Injection" },
    { href: "/wellness", label: "Wellness" },
    { href: "/peptides", label: "Peptides" },
    { href: "/calculator", label: "Calculator" },
    { href: "/stacks", label: "Stacks" },
    { href: "/profile", label: "Profile" },
  ];

  const navItems = user ? loggedInNav : publicNav;

  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/peptiq-logo.png"
              alt="PEPTIQ"
              width={260}
              height={64}
              priority
              className="h-8 w-auto sm:h-10 md:h-12"
            />
          </Link>

          <div className="hidden items-center gap-6 xl:flex">
            <nav className="flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3 lg:text-[15px] ${
                      active
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "text-white hover:text-blue-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {user && isAdmin ? (
                <Link
                  href="/admin/peptides"
                  className={`rounded-full px-3 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3 lg:text-[15px] ${
                    isActivePath(pathname, "/admin/peptides")
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "text-white hover:text-blue-400"
                  }`}
                >
                  Admin
                </Link>
              ) : null}
            </nav>

            {user ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm font-medium text-white transition hover:text-blue-400 lg:text-[15px]"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className={`text-sm font-medium transition lg:text-[15px] ${
                  isActivePath(pathname, "/login")
                    ? "text-blue-400"
                    : "text-white hover:text-blue-400"
                }`}
              >
                Login
              </Link>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-white transition hover:border-white/20 hover:bg-white/5 xl:hidden"
          >
            <span className="sr-only">
              {mobileMenuOpen ? "Close menu" : "Open menu"}
            </span>
            <div className="flex h-5 w-5 flex-col items-center justify-center gap-1">
              <span
                className={`block h-0.5 w-5 bg-white transition ${
                  mobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-white transition ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-white transition ${
                  mobileMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 xl:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-white hover:bg-white/5 hover:text-blue-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {user && isAdmin ? (
                <Link
                  href="/admin/peptides"
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActivePath(pathname, "/admin/peptides")
                      ? "bg-blue-600 text-white"
                      : "text-white hover:bg-white/5 hover:text-blue-400"
                  }`}
                >
                  Admin
                </Link>
              ) : null}

              <div className="mt-2 border-t border-white/10 pt-2">
                {user ? (
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/5 hover:text-blue-400"
                    >
                      Logout
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActivePath(pathname, "/login")
                        ? "bg-blue-600 text-white"
                        : "text-white hover:bg-white/5 hover:text-blue-400"
                    }`}
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}