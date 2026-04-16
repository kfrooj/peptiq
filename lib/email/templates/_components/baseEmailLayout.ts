function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type BaseEmailLayoutProps = {
  title: string;
  intro?: string;
  bodyHtml: string;
  footerNote?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function renderBaseEmailLayout({
  title,
  intro,
  bodyHtml,
  footerNote,
  ctaLabel,
  ctaUrl,
}: BaseEmailLayoutProps) {

  return `
  <html>
    <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="padding:24px 24px 0 24px;">
                  <img
                    src="https://peptiq.uk/peptiq-logo-dark.png"
                    alt="PEPTIQ"
                    width="140"
                    style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
                  />
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:20px 24px 28px 24px;">
                  <h1 style="margin:0 0 12px 0;font-size:22px;">
                    ${escapeHtml(title)}
                  </h1>

                  ${
                    intro
                      ? `<p style="margin:0 0 16px 0;color:#4b5563;">${escapeHtml(
                          intro
                        )}</p>`
                      : ""
                  }

                  <div style="font-size:14px;color:#374151;line-height:1.6;">
                    ${bodyHtml}
                  </div>

                  ${
                    footerNote
                      ? `<p style="margin-top:20px;font-size:12px;color:#6b7280;">
                          ${escapeHtml(footerNote)}
                        </p>`
                      : ""
                  }
                </td>
              </tr>
            </table>

            <p style="max-width:560px;margin:14px auto 0 auto;font-size:12px;color:#9ca3af;text-align:center;">
              You’re receiving this email from PEPT|IQ.
            </p>

          </td>
        </tr>
      </table>
    </body>
    ${
  ctaLabel && ctaUrl
    ? `<div style="margin-top:24px;">
        <a
          href="${ctaUrl}"
          style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:14px;font-size:14px;font-weight:600;"
        >
          ${escapeHtml(ctaLabel)}
        </a>
      </div>`
    : ""
}
  </html>
  `;
}