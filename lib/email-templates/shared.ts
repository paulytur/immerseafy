export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

const BRAND = {
  bg: "#0f1a18",
  card: "#162420",
  border: "#225750",
  teal: "#98d8d8",
  tealDark: "#225750",
  text: "#f0f7f7",
  muted: "#8aa8a5",
  buttonBg: "#98d8d8",
  buttonText: "#225750",
  successBg: "rgba(34, 87, 80, 0.35)",
  successBorder: "#225750",
  successText: "#98d8d8",
  warningBg: "rgba(180, 120, 40, 0.15)",
  warningBorder: "rgba(245, 158, 11, 0.45)",
  warningText: "#fbbf24",
  codeBg: "#0a1210",
} as const;

type EmailLayoutOptions = {
  eyebrow: string;
  title: string;
  body: string;
  preheader?: string;
};

export function emailLayout({
  eyebrow,
  title,
  body,
  preheader,
}: EmailLayoutOptions): string {
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;padding:32px 28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.teal};">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0 0 24px;font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.text};">${escapeHtml(title)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${BRAND.muted};">Questions? Reply to this email or visit our website.</p>
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">© Immerseafy Freediving</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr>
    <td style="border-radius:999px;background-color:${BRAND.buttonBg};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${BRAND.buttonText};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function emailDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.muted};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.text};font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

export function emailDetailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;border-collapse:collapse;">
  ${rows}
</table>`;
}

export function emailText(
  html: string,
  options?: { muted?: boolean; marginBottom?: number }
): string {
  const color = options?.muted ? BRAND.muted : BRAND.text;
  const margin = options?.marginBottom ?? 16;
  return `<p style="margin:0 0 ${margin}px;font-size:15px;line-height:1.6;color:${color};">${html}</p>`;
}

export function emailLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.teal};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

export function emailCallout(
  tone: "success" | "warning",
  html: string
): string {
  const styles =
    tone === "success"
      ? {
          bg: BRAND.successBg,
          border: BRAND.successBorder,
          text: BRAND.successText,
        }
      : {
          bg: BRAND.warningBg,
          border: BRAND.warningBorder,
          text: BRAND.warningText,
        };

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;">
  <tr>
    <td style="padding:14px 16px;border-radius:12px;background-color:${styles.bg};border:1px solid ${styles.border};font-size:14px;line-height:1.5;color:${styles.text};">${html}</td>
  </tr>
</table>`;
}

export function emailCodeBlock(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
  <tr>
    <td style="padding-bottom:6px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(label)}</td>
  </tr>
  <tr>
    <td style="padding:12px 14px;border-radius:10px;background-color:${BRAND.codeBg};border:1px solid ${BRAND.border};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:15px;line-height:1.4;color:${BRAND.teal};word-break:break-all;">${escapeHtml(value)}</td>
  </tr>
</table>`;
}
