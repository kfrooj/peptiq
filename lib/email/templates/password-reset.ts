import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type PasswordResetEmailParams = {
  resetUrl: string;
  appName?: string;
  supportEmail: string;
};

export function getPasswordResetEmail({
  resetUrl,
  appName = "PEPTIQ",
  supportEmail,
}: PasswordResetEmailParams) {
  const subject = `Reset your ${appName} password`;

  const bodyHtml = `
    <p>We received a request to reset your password.</p>

    <p>
      Use the button below to choose a new password for your account.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div><strong>Request:</strong> Password reset</div>
      <div><strong>Account:</strong> Your ${appName} login</div>
    </div>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
  If the button doesn’t work, copy and paste this link into your browser:<br/>
  <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
</p>

    <p>
      If you did not request this, you can safely ignore this email.
    </p>

    <p>
      Need help? Contact
      <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Reset your password",
    intro:
      "Use this secure link to set a new password for your PEPTIQ account.",
    bodyHtml,
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
    footerNote:
      "For your security, this link should only be used by the account owner and may expire after a short time.",
  });

  const text = [
    "We received a request to reset your password.",
    "",
    `Reset your password here: ${resetUrl}`,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    `Need help? Contact ${supportEmail}.`,
  ].join("\n");

  return { subject, html, text };
}