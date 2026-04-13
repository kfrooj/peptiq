import { NextResponse } from "next/server";
import { sendPeptiqEmail } from "@/lib/email/resend";
import { getPasswordChangedEmail } from "@/lib/email/templates/password-changed";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailAddress = String(body.email ?? "").trim();

    if (!emailAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing email address" },
        { status: 400 }
      );
    }

    const email = getPasswordChangedEmail({
      appName: "PEPTIQ",
      supportEmail: "support@peptiq.uk",
    });

    await sendPeptiqEmail({
      to: emailAddress,
      subject: email.subject,
      html: email.html,
      text: email.text,
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