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
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader({ user, isAdmin }: Props) {
  const pathname = usePathname();

  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setToolsMenuOpen(false);
    setMoreMenuOpen(false);
    setMobileMenuOpen(false);
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
        setMobileMenuOpen(false);
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
    { href: "/home", label: "Home" },
    { href: "/peptides", label: "Peptides" },
    { href: "/calculator", label: "Calculator" },
  ];

  const loggedInPrimaryNav: NavItem[] = [
    { href: "/home", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/peptides", label: "Peptides" },
    { href: "/profile", label: "Profile" },
  ];

  const toolsNav: NavItem[] = [
    { href: "/log-injection", label: "Injection" },
    { href: "/plans", label: "Plans" },
    { href: "/wellness", label: "Wellness" },
    { href: "/calculator", label: "Calculator" },
    { href: "/stacks", label: "Stacks" },
  ];

  const moreNav: NavItem[] = [
    ...(isAdmin ? [{ href: "/admin/peptides", label: "Admin" }] : []),
  ];

  const primaryNav = user ? loggedInPrimaryNav : publicPrimaryNav;
  const toolsIsActive = toolsNav.some((item) => isActivePath(pathname, item.href));
  const moreIsActive = moreNav.some((item) => isActivePath(pathname, item.href));

  const pillBase =
    "rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200";
  const pillInactive =
    "text-slate-700 hover:bg-slate-100 hover:text-[#2F5E8E]";
  const pillActive = "bg-[#2F5E8E] text-white hover:bg-[#3E73A8]";

  return (
    <header className="border-b border-slate-200 bg-gradient-to-r from-[#F8FBFF] to-[#EEF5FF] text-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <Link href="/home" className="shrink-0" aria-label="Go to home">
            <div className="relative h-8 w-[110px] sm:h-9 sm:w-[135px] lg:h-10 lg:w-[150px]">
              <Image
                src="/peptiq-logo-dark.png"
                alt="PEPTIQ"
                fill
                priority
                className="object-contain object-left"
                sizes="200px"
              />
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${pillBase} ${active ? pillActive : pillInactive}`}
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
                  className={`${pillBase} inline-flex items-center gap-1 ${
                    toolsIsActive || toolsMenuOpen ? pillActive : pillInactive
                  }`}
                >
                  Tools
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      toolsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {toolsMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="p-2">
                      {toolsNav.map((item) => {
                        const active = isActivePath(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                              active
                                ? "bg-[#2F5E8E] text-white"
                                : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
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
                  className={`${pillBase} inline-flex items-center gap-1 ${
                    moreIsActive || moreMenuOpen ? pillActive : pillInactive
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
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
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
                                ? "bg-[#2F5E8E] text-white"
                                : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
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

            {user ? (
              <form action="/auth/signout" method="post" className="ml-1">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#2F5E8E]"
                >
                  Logout
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${pillBase} ${
                    isActivePath(pathname, "/login") ? pillActive : pillInactive
                  }`}
                >
                  Login
                </Link>

                <Link
                  href="/login"
                  className="rounded-full bg-[#2F5E8E] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3E73A8]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!user ? (
              <Link
                href="/login"
                className="rounded-full bg-[#2F5E8E] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3E73A8] whitespace-nowrap"
              >
                Sign up
              </Link>
            ) : (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 whitespace-nowrap"
                >
                  Logout
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 whitespace-nowrap"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
            >
              Menu
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
            <div className="grid gap-2">
              {primaryNav.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#2F5E8E] text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {!user ? (
                <Link
                  href="/login"
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActivePath(pathname, "/login")
                      ? "bg-[#2F5E8E] text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
                  }`}
                >
                  Login
                </Link>
              ) : null}

              {user
                ? toolsNav.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-[#2F5E8E] text-white"
                            : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })
                : null}

              {moreNav.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#2F5E8E] text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
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
    </header>
  );
}