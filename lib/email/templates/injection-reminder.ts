import { renderBaseEmailLayout } from "@/lib/email/templates/_components/baseEmailLayout";

type InjectionReminderEmailParams = {
  userName?: string | null;
  planName: string;
  doseAmount?: number | null;
  doseUnit?: string | null;
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

export function getInjectionReminderEmail({
  userName,
  planName,
  doseAmount,
  doseUnit,
  scheduledLabel,
  appUrl,
  appName = "PEPT|IQ",
}: InjectionReminderEmailParams) {
  const safeName = userName?.trim() ? escapeHtml(userName) : null;
  const safePlanName = escapeHtml(planName);
  const safeScheduled = escapeHtml(scheduledLabel);

  const greeting = safeName ? `Hi ${safeName},` : "Hi,";
  const doseText =
    doseAmount && doseUnit
      ? `${escapeHtml(String(doseAmount))}${escapeHtml(doseUnit)}`
      : "your scheduled dose";

  const subject = `${appName} reminder: injection due soon`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">${greeting}</p>

    <p style="margin:0 0 16px 0;">
      You have an injection due soon.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="margin:0 0 6px 0;"><strong>Plan:</strong> ${safePlanName}</div>
      <div style="margin:0 0 6px 0;"><strong>Scheduled:</strong> ${safeScheduled}</div>
      <div><strong>Dose:</strong> ${doseText}</div>
    </div>

    <p style="margin:16px 0 0 0;">
      Open ${appName} to review your plan and log your injection.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Injection reminder",
    bodyHtml,
    ctaLabel: "Open your plan",
    ctaUrl: appUrl,
    footerNote: "This reminder was sent based on your notification preferences.",
  });

  const text = [
    greeting,
    "",
    "You have an injection due soon.",
    `Plan: ${planName}`,
    `Scheduled: ${scheduledLabel}`,
    `Dose: ${doseText}`,
    "",
    `Open your plan: ${appUrl}`,
  ].join("\n");

  return { subject, html, text };
}