import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPasswordChangedEmail } from "@/lib/email/templates/password-changed";

export async function POST() {
  try {
    const supabase = await createClient();
    const supportEmail = process.env.SUPPORT_EMAIL || "support@peptiq.uk";

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

    const emailContent = getPasswordChangedEmail({
      appName: "PEPT|IQ",
      supportEmail,
    });

    await sendPeptiqEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      fromType: "security",
      replyTo: supportEmail,
      tags: [
        { name: "category", value: "password-changed" },
        { name: "user_id", value: user.id },
      ],
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