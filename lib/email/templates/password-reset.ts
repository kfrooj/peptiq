import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type PasswordResetEmailParams = {
  resetUrl: string;
  appName?: string;
  supportEmail: string;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getPasswordResetEmail({
  resetUrl,
  appName = "PEPT|IQ",
  supportEmail,
}: PasswordResetEmailParams) {
  const safeAppName = escapeHtml(appName);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeResetUrl = escapeHtml(resetUrl);

  const subject = `Reset your ${appName} password`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      We received a request to reset your password.
    </p>

    <p style="margin:0 0 16px 0;">
      Use the button below to choose a new password for your account.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="margin:0 0 6px 0;"><strong>Request:</strong> Password reset</div>
      <div><strong>Account:</strong> Your ${safeAppName} login</div>
    </div>

    <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
      If the button doesn’t work, copy and paste this link into your browser:<br />
      <a href="${safeResetUrl}" style="color:#2563eb;text-decoration:none;">${safeResetUrl}</a>
    </p>

    <p style="margin:16px 0 0 0;">
      If you did not request this, you can safely ignore this email.
    </p>

    <p style="margin:16px 0 0 0;">
      Need help? Contact
      <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;">${safeSupportEmail}</a>.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Reset your password",
    intro: `Use this secure link to set a new password for your ${appName} account.`,
    bodyHtml,
    ctaLabel: "Reset password",
    ctaUrl: resetUrl,
    footerNote:
      "For your security, this link should only be used by the account owner and may expire after a short time.",
  });

  const text = [
    "Reset your password",
    "",
    `We received a request to reset your ${appName} password.`,
    "",
    `Reset your password here: ${resetUrl}`,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    `Need help? Contact ${supportEmail}.`,
  ].join("\n");

  return { subject, html, text };
}