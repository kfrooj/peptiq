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

export default function AppShell({ user, isAdmin, children }: Props) {
  const pathname = usePathname();

  const isDisclaimerRoute =
    pathname === "/disclaimer" || pathname.startsWith("/disclaimer/");

  const hideHeader = isDisclaimerRoute;
  const removeBottomNavPadding = isDisclaimerRoute;

  return (
    <>
      <DisclaimerGate />
      {!isDisclaimerRoute ? <AppSplashScreen /> : null}
      {!hideHeader ? <SiteHeader user={user} isAdmin={isAdmin} /> : null}
      <main className={removeBottomNavPadding ? "flex-1" : "flex-1 pb-24 md:pb-0"}>
        {children}
      </main>
    </>
  );
}