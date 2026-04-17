import { renderBaseEmailLayout } from "@/lib/email/templates/_components/baseEmailLayout";

type SubscriptionCancelledEmailParams = {
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

export function getSubscriptionCancelledEmail({
  userName,
  appName = "PEPT|IQ",
  appUrl,
}: SubscriptionCancelledEmailParams) {
  const safeName = userName?.trim() ? escapeHtml(userName) : null;
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";

  const subject = `Your ${appName} subscription has been cancelled`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">${greeting}</p>

    <p style="margin:0 0 16px 0;">
      Your subscription has been cancelled.
    </p>

    <p style="margin:0 0 16px 0;">
      If this was intentional, there’s nothing else you need to do. You can still return to ${appName} at any time to resubscribe.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Subscription cancelled",
    bodyHtml,
    ctaLabel: "Open PEPT|IQ",
    ctaUrl: appUrl,
    footerNote: "If you didn’t expect this change, please contact support.",
  });

  const text = [
    greeting,
    "",
    `Your ${appName} subscription has been cancelled.`,
    "",
    `Open ${appName}: ${appUrl}`,
  ].join("\n");

  return { subject, html, text };
}