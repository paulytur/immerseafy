import {
  emailButton,
  emailCallout,
  emailDetailRow,
  emailDetailsTable,
  emailLayout,
  emailText,
  escapeHtml,
  firstNameFrom,
} from "@/lib/email-templates/shared";

export type BookingExpiredEmailTemplateData = {
  customerName: string;
  summary: string;
  date: string;
  reference: string;
  contactUrl: string;
};

export function bookingExpiredEmailHtml(
  data: BookingExpiredEmailTemplateData
): string {
  const firstName = firstNameFrom(data.customerName);

  const body = [
    emailCallout(
      "warning",
      `<strong>Booking expired.</strong> Your deposit was not received before the deadline.`
    ),
    emailText(
      `Hi ${escapeHtml(firstName)}, your booking hold has been released because we did not receive your 50% deposit in time.`
    ),
    emailDetailsTable(
      [
        emailDetailRow("Session", data.date),
        emailDetailRow("Activities", data.summary),
        emailDetailRow("Reference", data.reference),
      ].join("")
    ),
    emailText(
      "If you would still like to join us, you are welcome to submit a new booking request or get in touch.",
      { muted: true }
    ),
    emailButton(data.contactUrl, "Contact us"),
  ].join("");

  return emailLayout({
    eyebrow: "Booking expired",
    title: "Your reservation was released",
    preheader: `Booking ${data.reference} expired — contact us to book again`,
    body,
  });
}

export function bookingExpiredEmailSubject(reference: string): string {
  return `Booking expired — ${reference}`;
}
