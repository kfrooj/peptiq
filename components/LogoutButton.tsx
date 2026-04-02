"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.refresh(); // refresh server state
    router.push("/"); // optional: redirect home
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
    >
      Logout
    </button>
  );
}