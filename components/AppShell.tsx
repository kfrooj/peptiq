"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import DisclaimerGate from "@/components/DisclaimerGate";
import AppSplashScreen from "@/components/AppSplashScreen";

type AppShellUser = {
  id: string;
  email?: string | null;
} | null;

type Props = {
  user: AppShellUser;
  isAdmin: boolean;
  children: React.ReactNode;
};

const SHELL_EXCLUDED_PATHS = ["/disclaimer"];

export default function AppShell({ user, isAdmin, children }: Props) {
  const pathname = usePathname();

  const isShellExcludedRoute = SHELL_EXCLUDED_PATHS.some(
    (excludedPath) =>
      pathname === excludedPath || pathname.startsWith(`${excludedPath}/`)
  );

  if (isShellExcludedRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <DisclaimerGate />
      <AppSplashScreen />
      <div className="min-h-screen bg-[var(--color-background)]">
        <SiteHeader user={user} isAdmin={isAdmin} />
        <main>{children}</main>
      </div>
    </>
  );
}