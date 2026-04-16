import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPasswordChangedEmail } from "@/lib/email/templates/password-changed";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const email = getPasswordChangedEmail({
      appName: "PEPTIQ",
      supportEmail: "support@peptiq.uk",
    });

    await sendPeptiqEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      fromType: "security",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Password changed email route error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send security email" },
      { status: 500 }
    );
  }
}