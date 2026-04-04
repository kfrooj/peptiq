import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const formData = await request.formData();
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name: name || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/profile");
}