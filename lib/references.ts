import { customAlphabet } from "nanoid";
import type { BookingStatus } from "@/lib/types";

const nanoidToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32
);

export function generatePaymentToken(): string {
  return nanoidToken();
}

export function generateBookingReference(date: string): string {
  const compact = date.replace(/-/g, "");
  const suffix = customAlphabet("0123456789", 4)();
  return `IMF-${compact}-${suffix}`;
}

export function generateInvoiceNumber(date: string): string {
  const compact = date.replace(/-/g, "");
  const suffix = customAlphabet("0123456789", 4)();
  return `INV-${compact}-${suffix}`;
}

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "awaiting_payment",
  "confirmed",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting",
  confirmed: "Confirmed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status];
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function paymentPageUrl(token: string): string {
  return `${siteUrl()}/book/${token}/pay`;
}

export function bookingSummaryPdfUrl(reference: string, token: string): string {
  const params = new URLSearchParams({ ref: reference, token });
  return `${siteUrl()}/api/bookings/summary?${params.toString()}`;
}
