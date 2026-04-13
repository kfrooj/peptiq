import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;

  await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  redirect("/profile");
}