import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type MissedInjectionAlertEmailParams = {
  userName?: string | null;
  scheduledLabel: string;
  appName?: string;
};

export function getMissedInjectionAlertEmail({
  userName,
  scheduledLabel,
  appName = "PEPTIQ",
}: MissedInjectionAlertEmailParams) {
  const greeting = userName?.trim() ? `Hi ${userName},` : "Hi,";
  const subject = `${appName} alert: missed injection`;

  const bodyHtml = `
    <p>${greeting}</p>
    <p>Your scheduled injection time has passed.</p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div><strong>Scheduled:</strong> ${scheduledLabel}</div>
    </div>

    <p>
      Open ${appName} to review your plan, update your log, or mark the reminder as completed if you have already taken it.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Missed injection alert",
    bodyHtml,
    footerNote:
      "If you have already completed this injection, you can update the reminder status in PEPTIQ.",
  });

  const text = [
    greeting,
    "",
    "Your scheduled injection time has passed.",
    `Scheduled: ${scheduledLabel}`,
    "",
    `Open ${appName} to review your plan, update your log, or mark the reminder as completed.`,
  ].join("\n");

  return { subject, html, text };
}