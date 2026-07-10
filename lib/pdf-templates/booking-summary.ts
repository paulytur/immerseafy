import type { BreakdownLine } from "@/lib/booking-breakdown";
import { BOOKING_STATUS_LABELS } from "@/lib/references";
import type { BookingStatus } from "@/lib/types";
import { PdfBuilder } from "@/lib/pdf-templates/shared";

export type BookingSummaryPdfData = {
  reference: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tripDates: string;
  headcount: number;
  lineItems: BreakdownLine[];
  totalCents: number;
  createdAt: string;
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Request received — pending review",
  awaiting_payment: BOOKING_STATUS_LABELS.awaiting_payment,
  confirmed: BOOKING_STATUS_LABELS.confirmed,
  cancelled: BOOKING_STATUS_LABELS.cancelled,
  expired: BOOKING_STATUS_LABELS.expired,
};

function summaryNote(status: BookingStatus): string {
  if (status === "pending") {
    return "We will confirm availability within 1-2 business days. This summary is not a final invoice.";
  }
  if (status === "awaiting_payment") {
    return "A 50% deposit is required to confirm your booking. The remaining balance is due on arrival. Include your booking reference in payment notes.";
  }
  return "Thank you for booking with Immerseafy.";
}

export async function renderBookingSummaryPdf(
  data: BookingSummaryPdfData
): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create();

  pdf.drawHeader("Booking Summary");
  pdf.drawReferenceBlock("Booking reference", data.reference);
  pdf.drawMetaLines([
    `Status: ${STATUS_LABELS[data.status] ?? data.status}`,
    `Submitted: ${new Date(data.createdAt).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`,
  ]);

  pdf.drawSectionTitle("Guest");
  pdf.drawContactBlock(data.customerName, data.customerEmail, data.customerPhone);

  pdf.drawSectionTitle("Trip");
  pdf.drawDetailRows([
    { label: "Dates", value: data.tripDates },
    { label: "Participants", value: String(data.headcount) },
  ]);

  pdf.drawSectionTitle("Breakdown");
  pdf.drawLineItems(
    data.lineItems.map((item) => ({
      label: item.label,
      subtitle: item.subtitle,
      amountCents: item.amountCents,
    }))
  );

  if (data.status === "awaiting_payment") {
    pdf.drawPaymentBreakdown(data.totalCents, "deposit_due");
  } else {
    pdf.drawTotalRow("Estimated total", data.totalCents);
  }
  pdf.drawNote(summaryNote(data.status));
  pdf.drawFooter();

  return pdf.save();
}
