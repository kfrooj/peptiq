import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
   
   const authHeader = req.headers.get("authorization");
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return new NextResponse("Unauthorized", { status: 401 });
   }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from("plan_reminders")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("REMINDERS TO PROCESS:", reminders);

  for (const reminder of reminders ?? []) {
    const { error: updateError } = await supabase
      .from("plan_reminders")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        is_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reminder.id);

    if (updateError) {
      console.error("REMINDER UPDATE ERROR:", updateError);
    }
  }

  return NextResponse.json({
    success: true,
    processed: reminders?.length ?? 0,
  });
}