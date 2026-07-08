import type { SupabaseClient } from "@supabase/supabase-js";
import {
  breakdownLinesFromDbItems,
  breakdownLinesFromResolved,
} from "@/lib/booking-breakdown";
import {
  bookingGroupHeadcount,
  extrasFromBookingRecord,
  type BookingExtras,
} from "@/lib/booking-extras";
import {
  fetchBookingItems,
  formatItemLabel,
  getBookingEmailContext,
  type ResolvedBookingItem,
} from "@/lib/booking-items";
import {
  generateBookingSummaryPdf,
  type BookingSummaryPdfData,
} from "@/lib/booking-summary-pdf";
import type { BookingStatus } from "@/lib/types";

type BookingRecord = {
  id: string;
  reference: string;
  status: BookingStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  headcount: number;
  start_date: string | null;
  created_at: string;
  meals_requested?: boolean | null;
  carpool_requested?: boolean | null;
  room_requested?: boolean | null;
  room_decline_reason?: string | null;
  session_slots?: {
    service_slug: string;
    date: string;
    price_cents: number;
  } | null;
};

export async function buildBookingSummaryPdfData(
  supabase: SupabaseClient,
  booking: BookingRecord
): Promise<BookingSummaryPdfData> {
  const ctx = await getBookingEmailContext(supabase, booking);
  const extras = extrasFromBookingRecord(booking);
  const items = await fetchBookingItems(supabase, booking.id);

  const sessionDurationDays = (
    items.length > 0
      ? Math.max(...items.map((item) => item.duration_days), 1)
      : 1
  ) as 1 | 2;

  const participantCount =
    items.length > 0
      ? bookingGroupHeadcount(items)
      : Math.max(1, booking.headcount);

  let lineItems =
    items.length > 0
      ? breakdownLinesFromDbItems(
          items,
          extras,
          sessionDurationDays,
          participantCount
        )
      : [];

  if (lineItems.length === 0 && booking.session_slots) {
    const slot = booking.session_slots;
    lineItems = [
      {
        label: formatItemLabel({
          serviceSlug: slot.service_slug,
          quantity: booking.headcount,
          durationDays: 1,
        }),
        amountCents: slot.price_cents * booking.headcount,
      },
    ];
  }

  return {
    reference: booking.reference,
    status: booking.status,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    tripDates: ctx.date,
    headcount: booking.headcount,
    lineItems,
    totalCents: ctx.totalCents,
    createdAt: booking.created_at,
  };
}

export async function generateBookingSummaryPdfForBooking(
  supabase: SupabaseClient,
  booking: BookingRecord
): Promise<Uint8Array> {
  const data = await buildBookingSummaryPdfData(supabase, booking);
  return generateBookingSummaryPdf(data);
}

export function generateBookingSummaryPdfFromDraft(input: {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tripDates: string;
  headcount: number;
  items: ResolvedBookingItem[];
  extras: BookingExtras;
  sessionDurationDays: 1 | 2;
  participantCount: number;
  totalCents: number;
  createdAt?: string;
}): Promise<Uint8Array> {
  return generateBookingSummaryPdf({
    reference: input.reference,
    status: "pending",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    tripDates: input.tripDates,
    headcount: input.headcount,
    lineItems: breakdownLinesFromResolved(
      input.items,
      input.extras,
      input.sessionDurationDays,
      input.participantCount
    ),
    totalCents: input.totalCents,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
}
