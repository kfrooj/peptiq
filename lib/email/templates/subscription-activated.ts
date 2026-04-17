import { renderBaseEmailLayout } from "@/lib/email/templates/_components/baseEmailLayout";

type SubscriptionActivatedEmailParams = {
  userName?: string | null;
  appName?: string;
  appUrl: string;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getSubscriptionActivatedEmail({
  userName,
  appName = "PEPT|IQ",
  appUrl,
}: SubscriptionActivatedEmailParams) {
  const safeName = userName?.trim() ? escapeHtml(userName) : null;
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";

  const subject = `Your ${appName} subscription is now active`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">${greeting}</p>

    <p style="margin:0 0 16px 0;">
      Your subscription is now active and your Pro access is ready to use.
    </p>

    <p style="margin:0 0 16px 0;">
      You can now continue in ${appName} with your upgraded access.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Subscription activated",
    bodyHtml,
    ctaLabel: "Open PEPT|IQ",
    ctaUrl: appUrl,
    footerNote: "Thanks for subscribing to PEPT|IQ.",
  });

  const text = [
    greeting,
    "",
    `Your ${appName} subscription is now active.`,
    "",
    `Open ${appName}: ${appUrl}`,
  ].join("\n");

  return { subject, html, text };
}