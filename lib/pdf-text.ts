/** WinAnsi-safe price label for pdf-lib StandardFonts. */
export function formatPriceForPdf(cents: number): string {
  return `PHP ${(cents / 100).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

/** Normalize text so pdf-lib Helvetica (WinAnsi) can encode it. */
export function sanitizePdfText(text: string): string {
  return text
    .replace(/\u20b1/g, "PHP ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/[^\u0009\u000A\u000D\u0020-\u00FF]/g, "");
}
