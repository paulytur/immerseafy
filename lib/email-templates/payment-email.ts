import {
  emailButton,
  emailDetailRow,
  emailDetailsTable,
  emailLayout,
  emailLink,
  emailText,
  escapeHtml,
  firstNameFrom,
} from "@/lib/email-templates/shared";

export type PaymentEmailTemplateData = {
  customerName: string;
  summary: string;
  date: string;
  reference: string;
  depositFormatted: string;
  balanceFormatted: string;
  totalFormatted: string;
  expiryLabel: string;
  payUrl: string;
  summaryPdfUrl?: string;
  variant?: "payment" | "reminder";
};

export function paymentEmailHtml(data: PaymentEmailTemplateData): string {
  const isReminder = data.variant === "reminder";
  const firstName = firstNameFrom(data.customerName);

  const eyebrow = isReminder ? "Deposit reminder" : "Deposit required";
  const title = isReminder
    ? "Your deposit is due soon"
    : "Complete your booking deposit";
  const preheader = isReminder
    ? `Reminder: pay ${data.depositFormatted} deposit for your Immerseafy booking (${data.reference})`
    : `Pay ${data.depositFormatted} deposit to confirm your Immerseafy booking (${data.reference})`;

  const intro = isReminder
    ? `Hi ${escapeHtml(firstName)}, this is a friendly reminder to send your 50% deposit for your upcoming session.`
    : `Hi ${escapeHtml(firstName)}, great news — your booking has been approved with our resort partner. Send your 50% deposit below to secure your spot.`;

  const details = emailDetailsTable(
    [
      emailDetailRow("Session", data.date),
      emailDetailRow("Activities", data.summary),
      emailDetailRow("Reference", data.reference),
      emailDetailRow("Estimated total", data.totalFormatted),
      emailDetailRow("Deposit due now (50%)", data.depositFormatted),
      emailDetailRow("Balance on arrival", data.balanceFormatted),
      emailDetailRow("Pay deposit by", data.expiryLabel),
    ].join("")
  );

  const pdfLink = data.summaryPdfUrl
    ? emailText(
        `You can also ${emailLink(data.summaryPdfUrl, "download your booking summary (PDF)")} for your records.`,
        { muted: true, marginBottom: 0 }
      )
    : "";

  const body = [
    emailText(intro),
    details,
    emailText(
      "Scan the QR Ph code on the payment page and pay the deposit amount exactly. Your booking is confirmed once we verify your deposit. The remaining balance is due on arrival.",
      { muted: true }
    ),
    emailButton(data.payUrl, "Pay deposit via QR Pay"),
    pdfLink,
  ].join("");

  return emailLayout({ eyebrow, title, body, preheader });
}

export function paymentEmailSubject(
  reference: string,
  variant: PaymentEmailTemplateData["variant"] = "payment"
): string {
  return variant === "reminder"
    ? `Deposit reminder — ${reference}`
    : `Deposit required — ${reference}`;
}
