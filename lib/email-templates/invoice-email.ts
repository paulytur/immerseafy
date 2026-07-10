import {
  emailButton,
  emailCallout,
  emailCodeBlock,
  emailDetailRow,
  emailDetailsTable,
  emailLayout,
  emailLink,
  emailText,
  escapeHtml,
  firstNameFrom,
} from "@/lib/email-templates/shared";

export type InvoiceEmailTemplateData = {
  customerName: string;
  summary: string;
  date: string;
  reference: string;
  invoiceNumber: string;
  depositFormatted: string;
  balanceFormatted: string;
  totalFormatted: string;
};

export function invoiceEmailHtml(data: InvoiceEmailTemplateData): string {
  const firstName = firstNameFrom(data.customerName);

  const body = [
    emailCallout(
      "success",
      `<strong>Deposit received.</strong> Your booking is now confirmed.`
    ),
    emailText(
      `Hi ${escapeHtml(firstName)}, thank you for your deposit. We look forward to diving with you. The remaining balance is due on arrival.`
    ),
    emailDetailsTable(
      [
        emailDetailRow("Session", data.date),
        emailDetailRow("Activities", data.summary),
        emailDetailRow("Reference", data.reference),
        emailDetailRow("Invoice", data.invoiceNumber),
        emailDetailRow("Estimated total", data.totalFormatted),
        emailDetailRow("Deposit paid (50%)", data.depositFormatted),
        emailDetailRow("Balance on arrival", data.balanceFormatted),
      ].join("")
    ),
    emailText(
      `Your invoice <strong>${escapeHtml(data.invoiceNumber)}</strong> is attached to this email as a PDF.`,
      { muted: true, marginBottom: 0 }
    ),
  ].join("");

  return emailLayout({
    eyebrow: "Booking confirmed",
    title: "You're all set",
    preheader: `Booking confirmed — invoice ${data.invoiceNumber} for ${data.reference}`,
    body,
  });
}

export function invoiceEmailSubject(invoiceNumber: string): string {
  return `Booking confirmed — Invoice ${invoiceNumber}`;
}
