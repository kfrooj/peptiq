import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentProfileError) {
      return NextResponse.json(
        { error: currentProfileError.message },
        { status: 500 }
      );
    }

    if (currentProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const role = body?.role;

    if (role !== "admin" && role !== "user") {
      return NextResponse.json(
        { error: "Invalid role value." },
        { status: 400 }
      );
    }

    if (user.id === id && role === "user") {
      return NextResponse.json(
        { error: "You cannot remove admin access from your own account." },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const { data: updatedRows, error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", id)
        .select("id");

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id,
          role: "admin",
          created_at: new Date().toISOString(),
          email_reminders: true,
          missed_reminder_alerts: true,
          notification_email_reminders: true,
          notification_missed_alerts: true,
          disclaimer_accepted: false,
          plan_tier: "free",
        });

        if (insertError) {
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }
      }
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: role === "admin" ? "User promoted to admin." : "Admin removed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected role update error.",
      },
      { status: 500 }
    );
  }
}