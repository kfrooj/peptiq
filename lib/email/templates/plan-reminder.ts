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
    doseAmount && doseUnit ? `${doseAmount}${doseUnit}` : "your scheduled dose";

  const subject = `${appName} reminder: ${planName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 22px; margin-bottom: 16px;">Injection reminder</h1>
        <p>${greeting}</p>
        <p>This is a reminder for your plan <strong>${planName}</strong>.</p>
        <p>
          Scheduled time: <strong>${scheduledLabel}</strong><br />
          Dose: <strong>${doseText}</strong>
        </p>
        <p>Open PEPTIQ to review your plan and log your injection.</p>
      </div>
    </div>
  `;

  const text = [
    greeting,
    "",
    `This is a reminder for your plan "${planName}".`,
    `Scheduled time: ${scheduledLabel}`,
    `Dose: ${doseText}`,
    "",
    "Open PEPTIQ to review your plan and log your injection.",
  ].join("\n");

  return { subject, html, text };
}