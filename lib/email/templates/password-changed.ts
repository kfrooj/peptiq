type PasswordChangedEmailParams = {
  appName?: string;
  supportEmail?: string;
};

export function getPasswordChangedEmail({
  appName = "PEPTIQ",
  supportEmail = "support@peptiq.uk",
}: PasswordChangedEmailParams = {}) {
  const subject = `Your ${appName} password was changed`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 22px; margin-bottom: 16px;">Your password was changed</h1>
        <p style="margin: 0 0 12px;">
          This is a security alert to let you know that your ${appName} password was changed.
        </p>
        <p style="margin: 0 0 12px;">
          If this was you, no action is needed.
        </p>
        <p style="margin: 0 0 12px;">
          If this was not you, please reset your password immediately and contact support at
          <a href="mailto:${supportEmail}">${supportEmail}</a>.
        </p>
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          This email was sent automatically for account security.
        </p>
      </div>
    </div>
  `;

  const text = [
    `Your ${appName} password was changed.`,
    "",
    `If this was you, no action is needed.`,
    `If this was not you, please reset your password immediately and contact support at ${supportEmail}.`,
    "",
    `This email was sent automatically for account security.`,
  ].join("\n");

  return { subject, html, text };
}