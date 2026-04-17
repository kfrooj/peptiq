import { Resend } from "resend";

type EmailFromType = "default" | "security" | "support";

type SendPeptiqEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromType?: EmailFromType;
  replyTo?: string | string[];
  tags?: { name: string; value: string }[];
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

function getFromAddress(type: EmailFromType = "default") {
  const map = {
    default: process.env.RESEND_FROM_DEFAULT,
    security: process.env.RESEND_FROM_SECURITY,
    support: process.env.RESEND_FROM_SUPPORT,
  };

  const from = map[type] ?? map.default;

  if (!from) {
    throw new Error(`Missing FROM email for type: ${type}`);
  }

  return from;
}

export async function sendPeptiqEmail({
  to,
  subject,
  html,
  text,
  fromType = "default",
  replyTo,
  tags,
}: SendPeptiqEmailParams) {
  const resend = getResendClient();
  const from = getFromAddress(fromType);
  const normalizedTo = Array.isArray(to) ? to : [to];

  console.log("Sending PEPT|IQ email", {
    to: normalizedTo,
    subject,
    fromType,
    from,
    tags,
  });

  const { data, error } = await resend.emails.send({
    from,
    to: normalizedTo,
    subject,
    html,
    text,
    replyTo,
    tags,
  });

  if (error) {
    console.error("Resend email error", {
      to: normalizedTo,
      subject,
      fromType,
      from,
      tags,
      error,
    });

    throw new Error(error.message || "Failed to send email");
  }

  return data;
}