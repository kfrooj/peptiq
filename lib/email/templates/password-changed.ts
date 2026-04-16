import { renderBaseEmailLayout } from "./_components/baseEmailLayout";

type PasswordChangedEmailParams = {
  appName?: string;
  supportEmail: string;
};

export function getPasswordChangedEmail({
  appName = "PEPTIQ",
  supportEmail,
}: PasswordChangedEmailParams) {
  const subject = `Your ${appName} password was changed`;

  const bodyHtml = `
    <p>Your password was successfully updated.</p>

    <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
      <div><strong>Account:</strong> Your ${appName} login</div>
      <div><strong>Status:</strong> Password updated</div>
    </div>

    <p>
      If you made this change, no further action is needed.
    </p>

    <p>
      If this was not you, contact support immediately at
      <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>.
    </p>
  `;

  const html = renderBaseEmailLayout({
    title: "Your password was changed",
    intro: "This is a security confirmation for your PEPTIQ account.",
    bodyHtml,
    footerNote:
      "If you did not expect this change, contact support as soon as possible.",
  });

  const text = [
    "Your password was successfully updated.",
    "",
    `Account: Your ${appName} login`,
    "Status: Password updated",
    "",
    "If you made this change, no further action is needed.",
    "",
    `If this was not you, contact support immediately at ${supportEmail}.`,
  ].join("\n");

  return { subject, html, text };
}