import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailFromType = "default" | "security" | "support";

function getFromAddress(type: EmailFromType = "default") {
  const map = {
    default: process.env.RESEND_FROM_DEFAULT,
    security: process.env.RESEND_FROM_SECURITY,
    support: process.env.RESEND_FROM_SUPPORT,
  };

  return map[type] ?? map.default;
}

export async function sendPeptiqEmail({
  to,
  subject,
  html,
  text,
  fromType = "default",
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromType?: EmailFromType;
}) {
  const from = getFromAddress(fromType);

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!from) {
    throw new Error(`Missing FROM email for type: ${fromType}`);
  }

console.log("Sending email", {
  to,
  subject,
  fromType,
  from,
});

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (error) {
  console.error("Resend email error:", {
    to,
    subject,
    fromType,
    error,
  });

  throw new Error(error.message || "Failed to send email");
}
  return data;
}