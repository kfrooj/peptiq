import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type MissedInjectionAlertEmailParams = {
  userName?: string | null;
  scheduledLabel: string;
  appUrl: string;
  appName?: string;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getMissedInjectionAlertEmail({
  userName,
  scheduledLabel,
  appUrl,
  appName = "PEPT|IQ",
}: MissedInjectionAlertEmailParams) {
  const safeName = userName?.trim() ? escapeHtml(userName) : null;
  const safeScheduledLabel = escapeHtml(scheduledLabel);

  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const subject = `${appName} reminder: injection not yet logged`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      ${greeting}
    </p>

    <p style="margin:0 0 16px 0;">
      Your scheduled injection time has passed, and it hasn’t been logged yet.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div><strong>Scheduled:</strong> ${safeScheduledLabel}</div>
    </div>

    <p style="margin:16px 0 0 0;">
      Open ${appName} to review your plan, update your log, or mark this as completed if you’ve already taken it.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Injection reminder",
    bodyHtml,
    ctaLabel: "Review your plan",
    ctaUrl: appUrl,
    footerNote:
      `If you’ve already completed this injection, you can update its status in ${appName}.`,
  });

  const text = [
    greeting,
    "",
    "Your scheduled injection time has passed, and it hasn’t been logged yet.",
    `Scheduled: ${scheduledLabel}`,
    "",
    `Review your plan: ${appUrl}`,
    "",
    `If you’ve already completed this injection, you can update its status in ${appName}.`,
  ].join("\n");

  return { subject, html, text };
}