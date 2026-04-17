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
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>

    <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial, Helvetica, sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f5f7fb;">
        <tr>
          <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">

              <!-- Header -->
              <tr>
                <td style="padding:24px 24px 0 24px;">
                  <div style="font-size:20px;font-weight:700;color:#0f172a;">
                    PEPT|IQ
                  </div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:20px 24px 28px 24px;">
                  
                  <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;">
                    ${escapeHtml(title)}
                  </h1>

                  ${
                    intro
                      ? `<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
                          ${escapeHtml(intro)}
                        </p>`
                      : ""
                  }

                  <div style="font-size:14px;color:#374151;line-height:1.6;">
                    ${bodyHtml}
                  </div>

                  ${
                    ctaLabel && ctaUrl
                      ? `
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                        <tr>
                          <td align="center" bgcolor="#2563eb" style="border-radius:12px;">
                            <a
                              href="${ctaUrl}"
                              style="display:inline-block;padding:12px 18px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;"
                            >
                              ${escapeHtml(ctaLabel)}
                            </a>
                          </td>
                        </tr>
                      </table>
                    `
                      : ""
                  }

                  ${
                    footerNote
                      ? `<p style="margin-top:20px;font-size:12px;color:#6b7280;line-height:1.5;">
                          ${escapeHtml(footerNote)}
                        </p>`
                      : ""
                  }

                </td>
              </tr>

            </table>

            <!-- Footer -->
            <p style="max-width:560px;margin:14px auto 0 auto;font-size:12px;color:#9ca3af;text-align:center;">
              You’re receiving this email from PEPT|IQ.
            </p>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}