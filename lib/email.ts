import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const sender = from ?? process.env.RESEND_FROM_DEFAULT!;

    const { error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error("Email exception:", err);
    return { success: false };
  }
}