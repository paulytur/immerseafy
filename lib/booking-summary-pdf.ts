import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { BreakdownLine } from "@/lib/booking-breakdown";
import { formatPriceForPdf, sanitizePdfText } from "@/lib/pdf-text";
import type { BookingStatus } from "@/lib/types";

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
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
};

function truncate(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function generateBookingSummaryPdf(
  data: BookingSummaryPdfData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const draw = (
    text: string,
    x: number,
    y: number,
    size = 11,
    useBold = false,
    color = rgb(0.1, 0.15, 0.14)
  ) => {
    page.drawText(sanitizePdfText(text), { x, y, size, font: useBold ? bold : font, color });
  };

  const drawRight = (
    text: string,
    y: number,
    size = 11,
    useBold = false
  ) => {
    const safe = sanitizePdfText(text);
    const f = useBold ? bold : font;
    const width = f.widthOfTextAtSize(safe, size);
    page.drawText(safe, {
      x: pageWidth - margin - width,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.15, 0.14),
    });
  };

  draw("IMMERSEAFY FREEDIVING", margin, 780, 16, true);
  draw("BOOKING SUMMARY", margin, 755, 14, true);

  draw("Booking reference", margin, 720, 10, true, rgb(0.2, 0.45, 0.42));
  draw(data.reference, margin, 700, 18, true, rgb(0.08, 0.55, 0.5));

  draw(`Status: ${STATUS_LABELS[data.status] ?? data.status}`, margin, 675, 10);
  draw(
    `Submitted: ${new Date(data.createdAt).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    })}`,
    margin,
    658,
    10
  );

  draw("Guest", margin, 625, 12, true);
  draw(data.customerName, margin, 607);
  draw(data.customerEmail, margin, 591);
  draw(data.customerPhone, margin, 575);

  draw("Trip", margin, 545, 12, true);
  draw(data.tripDates, margin, 527);
  draw(`Total participants: ${data.headcount}`, margin, 511);

  draw("Breakdown", margin, 485, 12, true);

  let y = 465;
  for (const item of data.lineItems) {
    if (y < 120) break;

    const price =
      item.amountCents > 0 ? formatPriceForPdf(item.amountCents) : "Included";

    draw(truncate(item.label), margin, y, 10, true);
    drawRight(price, y, 10, item.amountCents > 0);
    y -= 14;

    if (item.subtitle) {
      draw(truncate(item.subtitle, 64), margin + 8, y, 9, false, rgb(0.35, 0.4, 0.38));
      y -= 14;
    }

    y -= 4;
  }

  page.drawLine({
    start: { x: margin, y: y + 6 },
    end: { x: pageWidth - margin, y: y + 6 },
    thickness: 0.5,
    color: rgb(0.75, 0.78, 0.77),
  });

  draw("Estimated total", margin, y - 10, 12, true);
  drawRight(formatPriceForPdf(data.totalCents), y - 10, 14, true);

  const note =
    data.status === "pending"
      ? "We will confirm availability within 1–2 business days. This summary is not a final invoice."
      : data.status === "awaiting_payment"
        ? "Payment is required to confirm your booking. Include your booking reference in payment notes."
        : "Thank you for booking with Immerseafy.";

  const noteLines = wrapText(note, font, 9, contentWidth);
  let noteY = 95;
  for (const line of noteLines) {
    draw(line, margin, noteY, 9, false, rgb(0.35, 0.4, 0.38));
    noteY -= 12;
  }

  draw(
    "Immerseafy Sports Equipment and Accessories — Mabini, Batangas, Philippines",
    margin,
    48,
    9,
    false,
    rgb(0.45, 0.48, 0.47)
  );

  return pdf.save();
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}
