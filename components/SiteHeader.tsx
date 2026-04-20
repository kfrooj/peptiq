"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

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

function AdminBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 sm:px-2.5 sm:py-1 sm:text-xs">
      Admin
    </span>
  );
}

export default function SiteHeader({ user, isAdmin }: Props) {
  const pathname = usePathname();

  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setToolsMenuOpen(false);
    setProfileMenuOpen(false);
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
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setToolsMenuOpen(false);
        setProfileMenuOpen(false);
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
    { href: "/dashboard", label: "Dashboard" },
    { href: "/peptides", label: "Peptides" },
  ];

  const loggedInPrimaryNav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/peptides", label: "Peptides" },
    { href: "/plans", label: "Plans" },
  ];

  const toolsNav: NavItem[] = [
    { href: "/log-injection", label: "Injection" },
    { href: "/wellness", label: "Wellness" },
    { href: "/calculator", label: "Calculator" },
    { href: "/stacks", label: "Stacks" },
  ];

  const profileNav: NavItem[] = [
    { href: "/profile", label: "Profile" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin hub" }] : []),
  ];

  const mobileBottomNav: NavItem[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/plans", label: "Plans" },
        { href: "/log-injection", label: "Log" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/peptides", label: "Peptides" },
        { href: "/login", label: "Login" },
      ];

  const primaryNav = user ? loggedInPrimaryNav : publicPrimaryNav;
  const toolsIsActive = toolsNav.some((item) => isActivePath(pathname, item.href));
  const profileIsActive = profileNav.some((item) =>
    isActivePath(pathname, item.href)
  );

  const pillBase =
    "rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200";
  const pillInactive =
    "text-slate-700 hover:bg-slate-100 hover:text-[#2F5E8E]";
  const pillActive = "bg-[#2F5E8E] text-white hover:bg-[#3E73A8]";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-gradient-to-r from-[#F8FBFF] to-[#EEF5FF] text-[#0F172A] backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="shrink-0"
              aria-label="Go to dashboard"
            >
              <div className="relative h-8 w-[110px] sm:h-9 sm:w-[135px] lg:h-10 lg:w-[150px]">
                <Image
                  src="/peptiq-logo-dark.png"
                  alt="PEPT|IQ"
                  fill
                  priority
                  className="object-contain object-left"
                  sizes="200px"
                />
              </div>
            </Link>

            {/* Desktop nav */}
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
                <>
                  <div className="relative" ref={toolsMenuRef}>
                    <button
                      type="button"
                      aria-expanded={toolsMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => {
                        setToolsMenuOpen((open) => !open);
                        setProfileMenuOpen(false);
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
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                      >
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Tools
                          </p>
                        </div>

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

                  {isAdmin ? <AdminBadge /> : null}

                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      aria-expanded={profileMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => {
                        setProfileMenuOpen((open) => !open);
                        setToolsMenuOpen(false);
                      }}
                      className={`${pillBase} inline-flex items-center gap-1 ${
                        profileIsActive || profileMenuOpen
                          ? pillActive
                          : pillInactive
                      }`}
                    >
                      Profile
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          profileMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {profileMenuOpen ? (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                      >
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Account
                          </p>
                        </div>

                        <div className="p-2">
                          {profileNav.map((item) => {
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

                          <div className="my-1 border-t border-slate-100" />

                          <form action="/auth/signout" method="post">
                            <button
                              type="submit"
                              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#2F5E8E]"
                            >
                              Logout
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
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
                    href="/login?mode=signup"
                    className="rounded-full bg-[#2F5E8E] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3E73A8]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile top bar */}
            <div className="flex items-center gap-2 md:hidden">
              {user && isAdmin ? <AdminBadge /> : null}

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                aria-expanded={mobileMenuOpen}
                aria-haspopup="menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          {mobileMenuOpen ? (
            <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-md md:hidden">
              <div className="grid gap-2">
                <div className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Main
                </div>

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

                {user ? (
                  <>
                    <div className="px-2 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Tools
                    </div>

                    {toolsNav.map((item) => {
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

                    <div className="px-2 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Account
                    </div>

                    {isAdmin ? (
                      <div className="px-4 py-1">
                        <AdminBadge />
                      </div>
                    ) : null}

                    {profileNav.map((item) => {
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

                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#2F5E8E]"
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="px-2 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Account
                    </div>

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

                    <Link
                      href="/login?mode=signup"
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                        pathname === "/login"
                          ? "bg-[#2F5E8E] text-white"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#2F5E8E]"
                      }`}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {mobileBottomNav.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-2 py-3 text-[11px] font-medium transition ${
                  active
                    ? "text-[#2F5E8E]"
                    : "text-slate-500 hover:text-[#2F5E8E]"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so bottom nav doesn't cover content on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}