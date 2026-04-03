"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    try {
      // 1. Sign out from Supabase
      await supabase.auth.signOut();

      // 2. Clear ALL PEPTIQ local storage (future-proof)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("peptiq_")) {
          localStorage.removeItem(key);
        }
      });

      // 3. Redirect + refresh app state
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
    >
      Logout
    </button>
  );
}