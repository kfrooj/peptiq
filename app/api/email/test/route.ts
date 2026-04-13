import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPeptiqEmail } from "@/lib/email/resend";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await sendPeptiqEmail({
      to: user.email,
      subject: "PEPTIQ email test",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>PEPTIQ notifications are connected</h2>
          <p>This is a test email from your PEPTIQ app using Resend.</p>
        </div>
      `,
      text: "PEPTIQ notifications are connected. This is a test email.",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send test email" },
      { status: 500 }
    );
  }
}