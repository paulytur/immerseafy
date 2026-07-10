import { PdfBuilder } from "@/lib/pdf-templates/shared";

export type InvoiceLineItem = {
  label: string;
  subtitle?: string;
  amountCents: number;
};

export type InvoicePdfData = {
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

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create();

  pdf.drawHeader("Invoice");
  pdf.drawReferenceBlock("Invoice number", data.invoiceNumber);
  pdf.drawMetaLines([
    `Booking reference: ${data.reference}`,
    `Deposit paid: ${new Date(data.paidAt).toLocaleDateString("en-PH", {
      dateStyle: "medium",
    })}`,
    "Status: Deposit received",
  ]);

  pdf.drawSectionTitle("Bill to");
  pdf.drawContactBlock(data.customerName, data.customerEmail, data.customerPhone);

  pdf.drawSectionTitle("Booking details");
  pdf.drawDetailRows([
    { label: "Session", value: data.date },
    { label: "Participants", value: String(data.headcount) },
  ]);

  pdf.drawSectionTitle("Items");
  pdf.drawLineItems(
    data.lineItems.map((item) => ({
      label: item.label,
      subtitle: item.subtitle,
      amountCents: item.amountCents,
    }))
  );

  pdf.drawPaymentBreakdown(data.totalCents, "deposit_paid");
  pdf.drawNote(
    "This invoice confirms your 50% deposit. The remaining balance is due on arrival. Please bring this document or your booking reference on the day of your session."
  );
  pdf.drawFooter();

  return pdf.save();
}
