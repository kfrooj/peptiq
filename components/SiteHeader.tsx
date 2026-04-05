"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

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

  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setToolsMenuOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setToolsMenuOpen(false);
      }

      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setToolsMenuOpen(false);
        setMoreMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const publicPrimaryNav: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/peptides", label: "Peptides" },
    { href: "/calculator", label: "Calculator" },
  ];

  const loggedInPrimaryNav: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/peptides", label: "Peptides" },
    { href: "/profile", label: "Profile" },
  ];

  const protocolToolsNav: NavItem[] = [
    { href: "/log-injection", label: "Log Injection" },
    { href: "/plans", label: "Plans" },
    { href: "/wellness", label: "Wellness" },
    { href: "/calculator", label: "Calculator" },
    { href: "/stacks", label: "Stacks" },
  ];

  const moreNav: NavItem[] = [
    ...(isAdmin ? [{ href: "/admin/peptides", label: "Admin" }] : []),
  ];

  const primaryNav = user ? loggedInPrimaryNav : publicPrimaryNav;
  const toolsIsActive = protocolToolsNav.some((item) =>
    isActivePath(pathname, item.href)
  );
  const moreIsActive = moreNav.some((item) => isActivePath(pathname, item.href));

  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/peptiq-logo.png"
              alt="PEPTIQ"
              width={260}
              height={64}
              priority
              className="h-8 w-auto lg:h-10"
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-4 lg:gap-6">
            <nav className="flex flex-wrap items-center justify-end gap-1 lg:gap-2">
              {primaryNav.map((item) => {
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

              {user ? (
                <div className="relative" ref={toolsMenuRef}>
                  <button
                    type="button"
                    aria-expanded={toolsMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => {
                      setToolsMenuOpen((open) => !open);
                      setMoreMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3 lg:text-[15px] ${
                      toolsIsActive || toolsMenuOpen
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "text-white hover:text-blue-400"
                    }`}
                  >
                    Protocol Tools
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        toolsMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {toolsMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[230px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
                    >
                      <div className="p-2">
                        {protocolToolsNav.map((item) => {
                          const active = isActivePath(pathname, item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "text-white hover:bg-white/5 hover:text-blue-400"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {moreNav.length ? (
                <div className="relative" ref={moreMenuRef}>
                  <button
                    type="button"
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => {
                      setMoreMenuOpen((open) => !open);
                      setToolsMenuOpen(false);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3 lg:text-[15px] ${
                      moreIsActive || moreMenuOpen
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "text-white hover:text-blue-400"
                    }`}
                  >
                    More
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        moreMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {moreMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
                    >
                      <div className="p-2">
                        {moreNav.map((item) => {
                          const active = isActivePath(pathname, item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                                active
                                  ? "bg-blue-600 text-white"
                                  : "text-white hover:bg-white/5 hover:text-blue-400"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </nav>

            {user ? (
              <form action="/auth/signout" method="post" className="shrink-0">
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
                className={`shrink-0 text-sm font-medium transition lg:text-[15px] ${
                  isActivePath(pathname, "/login")
                    ? "text-blue-400"
                    : "text-white hover:text-blue-400"
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}