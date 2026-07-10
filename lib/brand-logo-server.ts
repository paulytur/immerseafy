import { readFileSync } from "fs";
import { join } from "path";
import type { PDFDocument, PDFImage } from "pdf-lib";

const LOGO_RELATIVE_PATH = join("public", "images", "logo-light.png");

export function logoFilePath(): string {
  return join(process.cwd(), LOGO_RELATIVE_PATH);
}

export function readLogoPngBytes(): Uint8Array {
  return readFileSync(logoFilePath());
}

export async function embedBrandLogo(
  pdf: PDFDocument
): Promise<PDFImage | null> {
  try {
    return await pdf.embedPng(readLogoPngBytes());
  } catch {
    return null;
  }
}
