import { Resend } from "resend";
import {
  paymentEmailHtml,
  paymentEmailSubject,
} from "@/lib/email-templates/payment-email";
import {
  invoiceEmailHtml,
  invoiceEmailSubject,
} from "@/lib/email-templates/invoice-email";
import {
  bookingExpiredEmailHtml,
  bookingExpiredEmailSubject,
} from "@/lib/email-templates/booking-expired-email";
import {
  staffCredentialsEmailHtml,
  staffCredentialsEmailSubject,
} from "@/lib/email-templates/staff-credentials-email";
import { formatPrice } from "@/lib/services-catalog";
import { paymentBreakdown } from "@/lib/payment-amounts";
import { bookingSummaryPdfUrl, paymentPageUrl, siteUrl } from "@/lib/references";

export type EmailResult =
  | { sent: true }
  | { skipped: true; reason: string }
  | { error: string };

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  const raw =
    process.env.RESEND_FROM_EMAIL ?? "Immerseafy <onboarding@resend.dev>";
  // Resend requires "Name <email@domain.com>" — space before <
  if (/^[^<]+<[^>]+>$/.test(raw)) {
    return raw.replace(/^([^<]+)</, (_, name: string) => `${name.trim()} <`);
  }
  return raw;
}

type HtmlEmailOptions = {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
  }[];
};

async function sendHtmlEmail(options: HtmlEmailOptions): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    return { skipped: true, reason: "RESEND_API_KEY is not configured" };
  }

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });

  if (error) {
    const message = error.message ?? "Failed to send email";
    if (
      message.includes("testing emails") ||
      message.includes("verify a domain")
    ) {
      return {
        error:
          "Resend test mode only delivers to your Resend account email. Verify a domain at resend.com/domains and set RESEND_FROM_EMAIL to an address on that domain.",
      };
    }
    return { error: message };
  }

  if (!data?.id) {
    return { error: "Resend did not return a message id" };
  }

  return { sent: true };
}

export function describeEmailResult(result: EmailResult | undefined): string | null {
  if (!result) return null;
  if ("sent" in result) return "Email sent.";
  if ("reason" in result) return `Email not sent: ${result.reason}`;
  return `Email failed: ${result.error}`;
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

function formatPaymentExpiry(paymentExpiresAt?: string | null): string {
  return paymentExpiresAt
    ? new Date(paymentExpiresAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "120 hours";
}

function paymentEmailTemplateData(
  ctx: BookingEmailContext,
  variant: "payment" | "reminder" = "payment"
) {
  if (!ctx.paymentToken) return null;

  const { depositCents, balanceCents } = paymentBreakdown(ctx.totalCents);

  return {
    customerName: ctx.customerName,
    summary: ctx.summary,
    date: ctx.date,
    reference: ctx.reference,
    totalFormatted: formatPrice(ctx.totalCents),
    depositFormatted: formatPrice(depositCents),
    balanceFormatted: formatPrice(balanceCents),
    expiryLabel: formatPaymentExpiry(ctx.paymentExpiresAt),
    payUrl: paymentPageUrl(ctx.paymentToken),
    summaryPdfUrl: bookingSummaryPdfUrl(ctx.reference, ctx.paymentToken),
    variant,
  };
}

export async function sendPaymentEmail(
  ctx: BookingEmailContext
): Promise<EmailResult> {
  const template = paymentEmailTemplateData(ctx, "payment");
  if (!template) {
    return { skipped: true, reason: "Missing payment token" };
  }

  return sendHtmlEmail({
    to: ctx.customerEmail,
    subject: paymentEmailSubject(ctx.reference, "payment"),
    html: paymentEmailHtml(template),
  });
}

export async function sendInvoiceEmail(
  ctx: BookingEmailContext & { invoiceNumber: string },
  pdfBuffer: Uint8Array
): Promise<EmailResult> {
  const { depositCents, balanceCents } = paymentBreakdown(ctx.totalCents);

  return sendHtmlEmail({
    to: ctx.customerEmail,
    subject: invoiceEmailSubject(ctx.invoiceNumber),
    html: invoiceEmailHtml({
      customerName: ctx.customerName,
      summary: ctx.summary,
      date: ctx.date,
      reference: ctx.reference,
      invoiceNumber: ctx.invoiceNumber,
      totalFormatted: formatPrice(ctx.totalCents),
      depositFormatted: formatPrice(depositCents),
      balanceFormatted: formatPrice(balanceCents),
    }),
    attachments: [
      {
        filename: `${ctx.invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });
}

export async function sendBookingExpiredEmail(
  ctx: BookingEmailContext
): Promise<EmailResult> {
  return sendHtmlEmail({
    to: ctx.customerEmail,
    subject: bookingExpiredEmailSubject(ctx.reference),
    html: bookingExpiredEmailHtml({
      customerName: ctx.customerName,
      summary: ctx.summary,
      date: ctx.date,
      reference: ctx.reference,
      contactUrl: `${siteUrl()}/contact`,
    }),
  });
}

export async function sendPaymentReminderEmail(
  ctx: BookingEmailContext
): Promise<EmailResult> {
  const template = paymentEmailTemplateData(ctx, "reminder");
  if (!template) {
    return { skipped: true, reason: "Missing payment token" };
  }

  return sendHtmlEmail({
    to: ctx.customerEmail,
    subject: paymentEmailSubject(ctx.reference, "reminder"),
    html: paymentEmailHtml(template),
  });
}

type StaffCredentialsContext = {
  email: string;
  fullName: string;
  role: string;
  temporaryPassword: string;
  regenerated?: boolean;
};

export async function sendStaffCredentialsEmail(
  ctx: StaffCredentialsContext
): Promise<EmailResult> {
  return sendHtmlEmail({
    to: ctx.email,
    subject: staffCredentialsEmailSubject(ctx.regenerated),
    html: staffCredentialsEmailHtml({
      fullName: ctx.fullName,
      email: ctx.email,
      role: ctx.role,
      temporaryPassword: ctx.temporaryPassword,
      loginUrl: `${siteUrl()}/admin/login`,
      regenerated: ctx.regenerated,
    }),
  });
}
