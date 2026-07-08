import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatPriceForPdf, sanitizePdfText } from "@/lib/pdf-text";

type InvoiceLineItem = {
  label: string;
  amountCents: number;
};

type InvoiceData = {
  invoiceNumber: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  headcount: number;
  totalCents: number;
  paidAt: string;
  lineItems: InvoiceLineItem[];
};

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const draw = (
    text: string,
    x: number,
    y: number,
    size = 11,
    useBold = false
  ) => {
    page.drawText(sanitizePdfText(text), {
      x,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.15, 0.14),
    });
  };

  draw("IMMERSEAFY FREEDIVING", 50, 780, 16, true);
  draw("INVOICE", 50, 755, 14, true);
  draw(`Invoice #: ${data.invoiceNumber}`, 50, 730);
  draw(`Booking ref: ${data.reference}`, 50, 712);
  draw(`Date paid: ${new Date(data.paidAt).toLocaleDateString("en-PH")}`, 50, 694);

  draw("Bill to", 50, 660, 12, true);
  draw(data.customerName, 50, 642);
  draw(data.customerEmail, 50, 626);
  draw(data.customerPhone, 50, 610);

  draw("Booking details", 50, 575, 12, true);
  draw(`Start date: ${data.date}`, 50, 557);
  draw(`Total participants: ${data.headcount}`, 50, 541);

  let y = 520;
  for (const item of data.lineItems) {
    draw(`${item.label} - ${formatPriceForPdf(item.amountCents)}`, 50, y);
    y -= 16;
  }

  draw("Total", 50, y - 10, 12, true);
  draw(formatPriceForPdf(data.totalCents), 50, y - 28, 14, true);

  draw(
    "Immerseafy Sports Equipment and Accessories — Mabini, Batangas, Philippines",
    50,
    80,
    9
  );

  return pdf.save();
}
