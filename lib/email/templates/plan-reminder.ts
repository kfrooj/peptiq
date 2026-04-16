import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type PlanReminderEmailParams = {
  userName?: string | null;
  planName: string;
  doseAmount?: number | null;
  doseUnit?: string | null;
  scheduledLabel: string;
  appName?: string;
};

export function getPlanReminderEmail({
  userName,
  planName,
  doseAmount,
  doseUnit,
  scheduledLabel,
  appName = "PEPTIQ",
}: PlanReminderEmailParams) {
  const greeting = userName?.trim() ? `Hi ${userName},` : "Hi,";

  const doseText =
    doseAmount && doseUnit
      ? `${doseAmount}${doseUnit}`
      : "your scheduled dose";

  const subject = `${appName} reminder: ${planName}`;

  const bodyHtml = `
    <p>${greeting}</p>

    <p>
      This is a reminder for your plan <strong>${planName}</strong>.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div><strong>Scheduled:</strong> ${scheduledLabel}</div>
      <div><strong>Dose:</strong> ${doseText}</div>
    </div>

    <p>
      Open ${appName} to review your plan and log your injection.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Injection reminder",
    bodyHtml,
  });

  const text = [
    greeting,
    "",
    `Reminder for your plan "${planName}".`,
    `Scheduled: ${scheduledLabel}`,
    `Dose: ${doseText}`,
    "",
    `Open ${appName} to review your plan.`,
  ].join("\n");

  return { subject, html, text };
}