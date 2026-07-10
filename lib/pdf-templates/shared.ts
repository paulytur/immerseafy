import {
  PDFDocument,
  type PDFPage,
  type PDFFont,
  type PDFImage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { embedBrandLogo } from "@/lib/brand-logo-server";
import { paymentBreakdown } from "@/lib/payment-amounts";
import { formatPriceForPdf, sanitizePdfText } from "@/lib/pdf-text";

export const PDF_LAYOUT = {
  width: 595,
  height: 842,
  margin: 48,
  contentWidth: 595 - 96,
  footerY: 52,
  minY: 110,
} as const;

export const PDF_COLORS = {
  headerBg: rgb(34 / 255, 87 / 255, 80 / 255),
  headerText: rgb(0.96, 0.98, 0.98),
  eyebrow: rgb(0.72, 0.9, 0.9),
  title: rgb(0.04, 0.08, 0.07),
  text: rgb(0.08, 0.12, 0.11),
  muted: rgb(0.35, 0.47, 0.46),
  border: rgb(0.82, 0.88, 0.87),
  accent: rgb(0.13, 0.42, 0.39),
  panelBg: rgb(0.95, 0.98, 0.97),
  totalText: rgb(0.04, 0.08, 0.07),
} as const;

export type PdfFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

export async function createPdfFonts(pdf: PDFDocument): Promise<PdfFonts> {
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
}

export function truncatePdfText(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const safe = sanitizePdfText(text);
  const words = safe.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

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

export class PdfBuilder {
  readonly pdf: PDFDocument;
  readonly fonts: PdfFonts;
  readonly logoImage: PDFImage | null;
  page: PDFPage;
  y: number;

  constructor(
    pdf: PDFDocument,
    fonts: PdfFonts,
    page: PDFPage,
    startY: number,
    logoImage: PDFImage | null
  ) {
    this.pdf = pdf;
    this.fonts = fonts;
    this.logoImage = logoImage;
    this.page = page;
    this.y = startY;
  }

  static async create(): Promise<PdfBuilder> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([PDF_LAYOUT.width, PDF_LAYOUT.height]);
    const fonts = await createPdfFonts(pdf);
    const logoImage = await embedBrandLogo(pdf);
    return new PdfBuilder(
      pdf,
      fonts,
      page,
      PDF_LAYOUT.height - PDF_LAYOUT.margin,
      logoImage
    );
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    size: number,
    options?: {
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    }
  ) {
    const font = options?.bold ? this.fonts.bold : this.fonts.regular;
    const safe = sanitizePdfText(text);
    this.page.drawText(safe, {
      x,
      y,
      size,
      font,
      color: options?.color ?? PDF_COLORS.text,
      maxWidth: options?.maxWidth,
    });
  }

  drawRight(
    text: string,
    y: number,
    size: number,
    options?: { bold?: boolean; color?: ReturnType<typeof rgb> }
  ) {
    const font = options?.bold ? this.fonts.bold : this.fonts.regular;
    const safe = sanitizePdfText(text);
    const width = font.widthOfTextAtSize(safe, size);
    this.page.drawText(safe, {
      x: PDF_LAYOUT.width - PDF_LAYOUT.margin - width,
      y,
      size,
      font,
      color: options?.color ?? PDF_COLORS.text,
    });
  }

  drawHeader(documentTitle: string) {
    const headerHeight = 108;
    const top = PDF_LAYOUT.height;
    const logoHeight = 36;

    this.page.drawRectangle({
      x: 0,
      y: top - headerHeight,
      width: PDF_LAYOUT.width,
      height: headerHeight,
      color: PDF_COLORS.headerBg,
    });

    if (this.logoImage) {
      const logoWidth =
        (this.logoImage.width / this.logoImage.height) * logoHeight;
      this.page.drawImage(this.logoImage, {
        x: (PDF_LAYOUT.width - logoWidth) / 2,
        y: top - 20 - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    }

    const title = sanitizePdfText(documentTitle);
    const titleSize = 15;
    const titleWidth = this.fonts.bold.widthOfTextAtSize(title, titleSize);
    this.drawText(title, (PDF_LAYOUT.width - titleWidth) / 2, top - 82, titleSize, {
      bold: true,
      color: PDF_COLORS.headerText,
    });

    this.y = top - headerHeight - 28;
  }

  drawReferenceBlock(label: string, reference: string) {
    this.page.drawRectangle({
      x: PDF_LAYOUT.margin,
      y: this.y - 52,
      width: PDF_LAYOUT.contentWidth,
      height: 56,
      color: PDF_COLORS.panelBg,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
    });

    this.drawText(label, PDF_LAYOUT.margin + 14, this.y - 18, 9, {
      bold: true,
      color: PDF_COLORS.muted,
    });
    this.drawText(reference, PDF_LAYOUT.margin + 14, this.y - 40, 16, {
      bold: true,
      color: PDF_COLORS.accent,
    });

    this.y -= 72;
  }

  drawMetaLines(lines: string[]) {
    for (const line of lines) {
      this.drawText(line, PDF_LAYOUT.margin, this.y, 10, { color: PDF_COLORS.muted });
      this.y -= 14;
    }
    this.y -= 8;
  }

  drawSectionTitle(title: string) {
    this.drawText(title, PDF_LAYOUT.margin, this.y, 12, {
      bold: true,
      color: PDF_COLORS.title,
    });
    this.y -= 18;
  }

  drawDetailRows(rows: { label: string; value: string }[]) {
    for (const row of rows) {
      this.drawText(row.label, PDF_LAYOUT.margin, this.y, 9, {
        bold: true,
        color: PDF_COLORS.muted,
      });
      this.drawText(row.value, PDF_LAYOUT.margin + 120, this.y, 10);
      this.y -= 16;
    }
    this.y -= 6;
  }

  drawContactBlock(name: string, email: string, phone: string) {
    this.drawText(name, PDF_LAYOUT.margin, this.y, 11, { bold: true });
    this.y -= 15;
    this.drawText(email, PDF_LAYOUT.margin, this.y, 10, { color: PDF_COLORS.muted });
    this.y -= 14;
    this.drawText(phone, PDF_LAYOUT.margin, this.y, 10, { color: PDF_COLORS.muted });
    this.y -= 20;
  }

  drawLineItems(
    items: { label: string; subtitle?: string; amountCents: number }[]
  ) {
    const priceColumnWidth = 92;
    const labelWidth = PDF_LAYOUT.contentWidth - priceColumnWidth - 16;
    const labelSize = 10;
    const subtitleSize = 9;
    const labelLineHeight = 13;
    const subtitleLineHeight = 12;

    for (const item of items) {
      if (this.y < PDF_LAYOUT.minY) break;

      const price =
        item.amountCents > 0
          ? formatPriceForPdf(item.amountCents)
          : "Included";

      const labelLines = wrapText(
        item.label,
        this.fonts.bold,
        labelSize,
        labelWidth
      );

      this.drawRight(price, this.y, labelSize, {
        bold: item.amountCents > 0,
        color: item.amountCents > 0 ? PDF_COLORS.text : PDF_COLORS.muted,
      });

      for (const line of labelLines) {
        if (this.y < PDF_LAYOUT.minY) break;
        this.drawText(line, PDF_LAYOUT.margin, this.y, labelSize, { bold: true });
        this.y -= labelLineHeight;
      }

      if (item.subtitle) {
        const subtitleLines = wrapText(
          item.subtitle,
          this.fonts.regular,
          subtitleSize,
          labelWidth
        );

        for (const line of subtitleLines) {
          if (this.y < PDF_LAYOUT.minY) break;
          this.drawText(line, PDF_LAYOUT.margin + 8, this.y, subtitleSize, {
            color: PDF_COLORS.muted,
          });
          this.y -= subtitleLineHeight;
        }
      }

      this.y -= 6;
    }
  }

  drawTotalRow(label: string, amountCents: number) {
    this.page.drawLine({
      start: { x: PDF_LAYOUT.margin, y: this.y + 8 },
      end: { x: PDF_LAYOUT.width - PDF_LAYOUT.margin, y: this.y + 8 },
      thickness: 0.75,
      color: PDF_COLORS.border,
    });

    this.y -= 12;

    this.page.drawRectangle({
      x: PDF_LAYOUT.margin,
      y: this.y - 30,
      width: PDF_LAYOUT.contentWidth,
      height: 36,
      color: PDF_COLORS.panelBg,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
    });

    this.drawText(label, PDF_LAYOUT.margin + 14, this.y - 12, 12, {
      bold: true,
      color: PDF_COLORS.totalText,
    });
    this.drawRight(formatPriceForPdf(amountCents), this.y - 12, 14, {
      bold: true,
      color: PDF_COLORS.accent,
    });

    this.y -= 48;
  }

  drawAmountLine(
    label: string,
    amountCents: number,
    options?: { bold?: boolean; accent?: boolean; muted?: boolean }
  ) {
    const color = options?.accent
      ? PDF_COLORS.accent
      : options?.muted
        ? PDF_COLORS.muted
        : PDF_COLORS.text;

    this.drawText(label, PDF_LAYOUT.margin + 14, this.y, 10, {
      bold: options?.bold,
      color,
    });
    this.drawRight(formatPriceForPdf(amountCents), this.y, 10, {
      bold: options?.bold ?? options?.accent,
      color,
    });
    this.y -= 16;
  }

  drawPaymentBreakdown(
    totalCents: number,
    mode: "deposit_due" | "deposit_paid"
  ) {
    const { depositCents, balanceCents, depositPercent } =
      paymentBreakdown(totalCents);

    this.drawTotalRow("Estimated total", totalCents);

    if (mode === "deposit_due") {
      this.drawAmountLine(
        `Deposit due now (${depositPercent}%)`,
        depositCents,
        { bold: true, accent: true }
      );
    } else {
      this.drawAmountLine(`Deposit paid (${depositPercent}%)`, depositCents, {
        bold: true,
        accent: true,
      });
    }

    this.drawAmountLine("Balance due on arrival", balanceCents, { muted: true });
    this.y -= 4;
  }

  drawNote(note: string) {
    const lines = wrapText(note, this.fonts.regular, 9, PDF_LAYOUT.contentWidth);
    let noteY = 96;
    for (const line of lines) {
      this.drawText(line, PDF_LAYOUT.margin, noteY, 9, { color: PDF_COLORS.muted });
      noteY -= 12;
    }
  }

  drawFooter() {
    this.drawText(
      "Immerseafy Sports Equipment and Accessories",
      PDF_LAYOUT.margin,
      PDF_LAYOUT.footerY + 12,
      9,
      { bold: true, color: PDF_COLORS.muted }
    );
    this.drawText(
      "Mabini, Batangas, Philippines",
      PDF_LAYOUT.margin,
      PDF_LAYOUT.footerY,
      9,
      { color: PDF_COLORS.muted }
    );
  }

  async save(): Promise<Uint8Array> {
    return this.pdf.save();
  }
}
