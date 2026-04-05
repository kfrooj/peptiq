"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Home,
  ClipboardList,
  PlusCircle,
  HeartPulse,
  User as UserIcon,
} from "lucide-react";

type MobileBottomNavUser = {
  id: string;
  email?: string | null;
} | null;

type Props = {
  user: MobileBottomNavUser;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav({ user }: Props) {
  const pathname = usePathname();

  if (!user) return null;

  const hiddenRoutes = ["/disclaimer"];
  const shouldHide = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (shouldHide) return null;

  const items: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/plans", label: "Plans", icon: ClipboardList },
    { href: "/log-injection", label: "Log", icon: PlusCircle, accent: true },
    { href: "/wellness", label: "Wellness", icon: HeartPulse },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-all duration-200 active:scale-95 ${
                active
                  ? "text-[var(--color-accent)]"
                  : item.accent
                  ? "text-[var(--color-accent)]/80 hover:text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                  item.accent ? "h-10 w-10" : "h-9 w-9"
                } ${
                  active
                    ? item.accent
                      ? "bg-[var(--color-accent)] text-white shadow-sm"
                      : "bg-[var(--color-surface-muted)] shadow-sm"
                    : item.accent
                    ? "bg-[var(--color-surface-muted)]/60 group-hover:bg-[var(--color-surface-muted)]"
                    : "group-hover:bg-[var(--color-surface-muted)]/70"
                }`}
                aria-hidden="true"
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "scale-110" : ""
                  }`}
                />
              </span>

              <span className="text-[11px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}