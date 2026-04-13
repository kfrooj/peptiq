import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPeptiqEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }

  return data;
}