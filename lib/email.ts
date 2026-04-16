import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailFromType = "default" | "security" | "support";

function getFromAddress(type: EmailFromType = "default") {
  if (type === "security") return process.env.RESEND_FROM_SECURITY;
  if (type === "support") return process.env.RESEND_FROM_SUPPORT;
  return process.env.RESEND_FROM_DEFAULT;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromType = "default",
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromType?: EmailFromType;
}) {
  try {
    const from = getFromAddress(fromType);

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!from) {
      throw new Error(`Missing FROM email for type: ${fromType}`);
    }

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Email send error:", {
        to,
        from,
        subject,
        error: error.message,
      });
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error("Email exception:", err);
    return { success: false };
  }
}