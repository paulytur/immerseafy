import { Resend } from "resend";
import { formatPrice } from "@/lib/services-catalog";
import { bookingSummaryPdfUrl, paymentPageUrl } from "@/lib/references";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "Immerseafy <onboarding@resend.dev>";
}

type BookingEmailContext = {
  customerName: string;
  customerEmail: string;
  summary: string;
  date: string;
  reference: string;
  totalCents: number;
  extrasSummary?: string;
  paymentToken?: string;
  paymentExpiresAt?: string | null;
};

export async function sendPaymentEmail(ctx: BookingEmailContext) {
  const resend = getResend();
  if (!resend || !ctx.paymentToken) return { skipped: true };

  const payUrl = paymentPageUrl(ctx.paymentToken);
  const expiry = ctx.paymentExpiresAt
    ? new Date(ctx.paymentExpiresAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "120 hours";

  await resend.emails.send({
    from: fromAddress(),
    to: ctx.customerEmail,
    subject: `Payment required — ${ctx.reference}`,
    html: `
      <p>Hi ${ctx.customerName},</p>
      <p>Your booking starting <strong>${ctx.date}</strong> has been confirmed with our resort:</p>
      <p><strong>${ctx.summary}</strong></p>
      <p>Please complete payment of <strong>${formatPrice(ctx.totalCents)}</strong> by <strong>${expiry}</strong>.</p>
      <p><a href="${payUrl}">Pay now via QR Pay</a></p>
      <p>Reference: <strong>${ctx.reference}</strong></p>
      ${
        ctx.paymentToken
          ? `<p><a href="${bookingSummaryPdfUrl(ctx.reference, ctx.paymentToken)}">Download booking summary (PDF)</a></p>`
          : ""
      }
      <p>— Immerseafy Freediving</p>
    `,
  });

  return { sent: true };
}

export async function sendInvoiceEmail(
  ctx: BookingEmailContext & { invoiceNumber: string },
  pdfBuffer: Uint8Array
) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  await resend.emails.send({
    from: fromAddress(),
    to: ctx.customerEmail,
    subject: `Booking confirmed — Invoice ${ctx.invoiceNumber}`,
    html: `
      <p>Hi ${ctx.customerName},</p>
      <p>Payment received. Your booking starting <strong>${ctx.date}</strong> is <strong>confirmed</strong>:</p>
      <p><strong>${ctx.summary}</strong></p>
      <p>Invoice <strong>${ctx.invoiceNumber}</strong> is attached.</p>
      <p>Reference: <strong>${ctx.reference}</strong></p>
      <p>— Immerseafy Freediving</p>
    `,
    attachments: [
      {
        filename: `${ctx.invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  return { sent: true };
}

export async function sendBookingExpiredEmail(ctx: BookingEmailContext) {
  const resend = getResend();
  if (!resend) return { skipped: true };

  await resend.emails.send({
    from: fromAddress(),
    to: ctx.customerEmail,
    subject: `Booking expired — ${ctx.reference}`,
    html: `
      <p>Hi ${ctx.customerName},</p>
      <p>Your booking starting <strong>${ctx.date}</strong> has expired because payment was not received in time:</p>
      <p><strong>${ctx.summary}</strong></p>
      <p>Reference: <strong>${ctx.reference}</strong></p>
      <p>Contact us if you'd like to book again.</p>
      <p>— Immerseafy Freediving</p>
    `,
  });

  return { sent: true };
}

export async function sendPaymentReminderEmail(ctx: BookingEmailContext) {
  const resend = getResend();
  if (!resend || !ctx.paymentToken) return { skipped: true };

  const payUrl = paymentPageUrl(ctx.paymentToken);

  await resend.emails.send({
    from: fromAddress(),
    to: ctx.customerEmail,
    subject: `Payment reminder — ${ctx.reference}`,
    html: `
      <p>Hi ${ctx.customerName},</p>
      <p>Reminder: payment of <strong>${formatPrice(ctx.totalCents)}</strong> for your booking on <strong>${ctx.date}</strong> is due soon:</p>
      <p><strong>${ctx.summary}</strong></p>
      <p><a href="${payUrl}">Pay now via QR Pay</a></p>
      <p>Reference: <strong>${ctx.reference}</strong></p>
      <p>— Immerseafy Freediving</p>
    `,
  });

  return { sent: true };
}
