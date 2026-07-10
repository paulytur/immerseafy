import {
  emailButton,
  emailCodeBlock,
  emailDetailRow,
  emailDetailsTable,
  emailLayout,
  emailText,
  escapeHtml,
  firstNameFrom,
} from "@/lib/email-templates/shared";

export type StaffCredentialsEmailTemplateData = {
  fullName: string;
  email: string;
  role: string;
  temporaryPassword: string;
  loginUrl: string;
  regenerated?: boolean;
};

export function staffCredentialsEmailHtml(
  data: StaffCredentialsEmailTemplateData
): string {
  const firstName = firstNameFrom(data.fullName);
  const isReset = Boolean(data.regenerated);

  const body = [
    emailText(
      isReset
        ? `Hi ${escapeHtml(firstName)}, an admin has generated a new temporary password for your Immerseafy staff account.`
        : `Hi ${escapeHtml(firstName)}, your Immerseafy staff portal account is ready. Use the credentials below to sign in.`
    ),
    emailDetailsTable(
      [
        emailDetailRow("Role", data.role),
        emailDetailRow("Email", data.email),
      ].join("")
    ),
    emailCodeBlock("Temporary password", data.temporaryPassword),
    emailText(
      "You will be asked to set a new password immediately after signing in. Do not share this password — it is shown once.",
      { muted: true }
    ),
    emailButton(data.loginUrl, "Sign in to staff portal"),
  ].join("");

  return emailLayout({
    eyebrow: isReset ? "Password reset" : "Staff account",
    title: isReset ? "New temporary password" : "Your account is ready",
    preheader: isReset
      ? "Your Immerseafy staff password was reset"
      : "Your Immerseafy staff portal login details",
    body,
  });
}

export function staffCredentialsEmailSubject(regenerated?: boolean): string {
  return regenerated
    ? "New temporary password — Immerseafy staff portal"
    : "Staff portal login — Immerseafy";
}
