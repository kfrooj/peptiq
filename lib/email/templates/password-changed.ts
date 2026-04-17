import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type PasswordChangedEmailParams = {
  appName?: string;
  supportEmail: string;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getPasswordChangedEmail({
  appName = "PEPT|IQ",
  supportEmail,
}: PasswordChangedEmailParams) {
  const safeAppName = escapeHtml(appName);
  const safeSupportEmail = escapeHtml(supportEmail);

  const subject = `Your ${appName} password has been changed`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">
      Your password has been successfully changed.
    </p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="margin:0 0 6px 0;"><strong>Account:</strong> Your ${safeAppName} login</div>
      <div><strong>Status:</strong> Password changed</div>
    </div>

    <p style="margin:16px 0 0 0;">
      If you made this change, no further action is needed.
    </p>

    <p style="margin:16px 0 0 0;">
      If this wasn’t you, please contact support immediately at
      <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;">
        ${safeSupportEmail}
      </a>.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Password changed",
    intro: `This is a security confirmation for your ${appName} account.`,
    bodyHtml,
    footerNote:
      "If you did not expect this change, we recommend resetting your password immediately.",
  });

  const text = [
    "Password changed",
    "",
    `Your ${appName} password has been successfully changed.`,
    "",
    `Account: Your ${appName} login`,
    "Status: Password changed",
    "",
    "If you made this change, no further action is needed.",
    "",
    `If this wasn’t you, contact support immediately at ${supportEmail}.`,
  ].join("\n");

  return { subject, html, text };
}