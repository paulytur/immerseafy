import { addDays } from "@/lib/dates";
import {
  bookingExtrasTotalCents,
  bookingParticipantCount,
  extrasFromBookingRecord,
} from "@/lib/booking-extras";
import {
  bookingItemLineTotalCents,
  formatItemLabel,
} from "@/lib/booking-items";
import { getServiceBySlug } from "@/lib/services-catalog";
import type { Coach } from "@/lib/coaches";
import {
  comparePeriodsByNearestDate,
  formatBookingDates,
  groupAvailabilityByTwoDayPeriod,
  todayIsoDate,
  type CoachTwoDayPeriod,
} from "@/lib/schedule-utils";
import type { BookingItem, BookingStatus, BookingWithSlot } from "@/lib/types";
import { depositDueCents } from "@/lib/payment-amounts";

export type DashboardBookingPreview = {
  id: string;
  reference: string;
  customerName: string;
  status: BookingStatus;
  headcount: number;
  summary: string;
  participants: string[];
};

export type DashboardTrip = {
  startDate: string;
  endDate: string;
  dateLabel: string;
  coaches: Coach[];
  pendingCount: number;
  awaitingCount: number;
  confirmedCount: number;
  totalPax: number;
  confirmedRevenueCents: number;
  bookings: DashboardBookingPreview[];
  needsCoaches: boolean;
};

export type DashboardAlert = {
  id: string;
  tone: "amber" | "rose" | "teal";
  title: string;
  description: string;
  href: string;
};

export type DashboardPaymentDeadline = {
  id: string;
  reference: string;
  customerName: string;
  dateLabel: string;
  expiresAt: string;
  hoursLeft: number;
  totalCents: number;
  depositCents: number;
};

const ACTIVE_STATUSES: BookingStatus[] = [
  "pending",
  "awaiting_payment",
  "confirmed",
];

export function bookingTotalCents(booking: BookingWithSlot): number {
  const items = booking.booking_items ?? [];
  const slot = booking.session_slots;
  const extras = extrasFromBookingRecord(booking);
  const maxDuration = Math.max(...items.map((item) => item.duration_days), 1) as
    | 1
    | 2;
  const participantCount = bookingParticipantCount(items);

  const coursesTotal =
    items.length > 0
      ? items.reduce(
          (sum, item) => sum + bookingItemLineTotalCents(item),
          0
        )
      : slot
        ? slot.price_cents * booking.headcount
        : 0;

  return (
    coursesTotal +
    bookingExtrasTotalCents(extras, maxDuration, participantCount)
  );
}

function collectParticipantNames(booking: BookingWithSlot): string[] {
  const names: string[] = [];

  for (const item of booking.booking_items ?? []) {
    for (const name of item.participant_names ?? []) {
      const trimmed = name.trim();
      if (trimmed && !names.includes(trimmed)) {
        names.push(trimmed);
      }
    }
  }

  return names;
}

function bookingActivitySummary(items: BookingItem[]): string {
  if (items.length === 0) return "Booking";

  return items
    .map((item) => {
      const service = getServiceBySlug(item.service_slug);
      const title = service?.title ?? item.service_slug;
      const days = item.duration_days === 2 ? "2 days" : "1 day";
      return `${title} (${days})`;
    })
    .join(" · ");
}

function bookingPreview(booking: BookingWithSlot): DashboardBookingPreview {
  const items = (booking.booking_items ?? []) as BookingItem[];
  const participants = collectParticipantNames(booking);
  const summary =
    items.length > 0
      ? bookingActivitySummary(items)
      : booking.session_slots
        ? formatItemLabel({
            serviceSlug: booking.session_slots.service_slug,
            quantity: booking.headcount,
            durationDays: 1,
          })
        : "Booking";

  return {
    id: booking.id,
    reference: booking.reference,
    customerName: booking.customer_name,
    status: booking.status,
    headcount: booking.headcount,
    summary,
    participants,
  };
}

function bookingStartDate(booking: BookingWithSlot): string | null {
  return (
    booking.start_date ??
    booking.booking_items?.[0]?.start_date ??
    booking.session_slots?.date ??
    null
  );
}

export function buildDashboardTrips(
  periods: CoachTwoDayPeriod[],
  bookings: BookingWithSlot[],
  today = todayIsoDate(),
  limit = 6
): DashboardTrip[] {
  const tripMap = new Map<string, DashboardTrip>();

  for (const period of periods) {
    if (period.endDate < today) continue;

    tripMap.set(period.startDate, {
      startDate: period.startDate,
      endDate: period.endDate,
      dateLabel: formatBookingDates(period.startDate, 2),
      coaches: period.coaches,
      pendingCount: 0,
      awaitingCount: 0,
      confirmedCount: 0,
      totalPax: 0,
      confirmedRevenueCents: 0,
      bookings: [],
      needsCoaches: period.coaches.length === 0,
    });
  }

  for (const booking of bookings) {
    const startDate = bookingStartDate(booking);
    if (!startDate || startDate < today) continue;
    if (!ACTIVE_STATUSES.includes(booking.status)) continue;

    const endDate = addDays(startDate, 1);
    const existing = tripMap.get(startDate);

    const trip =
      existing ??
      ({
        startDate,
        endDate,
        dateLabel: formatBookingDates(startDate, 2),
        coaches: [],
        pendingCount: 0,
        awaitingCount: 0,
        confirmedCount: 0,
        totalPax: 0,
        confirmedRevenueCents: 0,
        bookings: [],
        needsCoaches: true,
      } satisfies DashboardTrip);

    trip.totalPax += booking.headcount;

    if (booking.status === "pending") trip.pendingCount += 1;
    if (booking.status === "awaiting_payment") trip.awaitingCount += 1;
    if (booking.status === "confirmed") {
      trip.confirmedCount += 1;
      trip.confirmedRevenueCents += depositDueCents(bookingTotalCents(booking));
    }

    trip.bookings.push(bookingPreview(booking));
    trip.needsCoaches = trip.coaches.length === 0 && trip.bookings.length > 0;

    tripMap.set(startDate, trip);
  }

  return Array.from(tripMap.values())
    .sort((a, b) => comparePeriodsByNearestDate(
      { startDate: a.startDate, endDate: a.endDate, coaches: a.coaches },
      { startDate: b.startDate, endDate: b.endDate, coaches: b.coaches },
      today
    ))
    .slice(0, limit);
}

export function buildDashboardAlerts(input: {
  pendingCount: number;
  expiringPaymentCount: number;
  tripsMissingCoaches: number;
  upcomingScheduleBlocks: number;
  today?: string;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (input.pendingCount > 0) {
    alerts.push({
      id: "pending",
      tone: "amber",
      title: `${input.pendingCount} booking${input.pendingCount === 1 ? "" : "s"} need approval`,
      description: "Review requests and send payment links.",
      href: "/admin/bookings?status=pending",
    });
  }

  if (input.expiringPaymentCount > 0) {
    alerts.push({
      id: "expiring",
      tone: "rose",
      title: `${input.expiringPaymentCount} payment${input.expiringPaymentCount === 1 ? "" : "s"} expiring soon`,
      description: "Follow up before the 120-hour window closes.",
      href: "/admin/bookings?status=awaiting_payment",
    });
  }

  if (input.tripsMissingCoaches > 0) {
    alerts.push({
      id: "coaches",
      tone: "amber",
      title: `${input.tripsMissingCoaches} trip${input.tripsMissingCoaches === 1 ? "" : "s"} missing coach coverage`,
      description: "Bookings exist but no coaches are marked available.",
      href: "/admin/schedule",
    });
  }

  if (input.upcomingScheduleBlocks === 0) {
    alerts.push({
      id: "schedule",
      tone: "teal",
      title: "No upcoming coach availability",
      description: "Add 2-day blocks so guests can book.",
      href: "/admin/schedule",
    });
  }

  return alerts;
}

export function buildPaymentDeadlines(
  bookings: BookingWithSlot[],
  limit = 5
): DashboardPaymentDeadline[] {
  const now = Date.now();

  return bookings
    .filter(
      (booking) =>
        booking.status === "awaiting_payment" && booking.payment_expires_at
    )
    .map((booking) => {
      const expiresAt = booking.payment_expires_at!;
      const expiresMs = new Date(expiresAt).getTime();
      const hoursLeft = Math.max(
        0,
        Math.round((expiresMs - now) / (1000 * 60 * 60))
      );
      const startDate = bookingStartDate(booking);

      return {
        id: booking.id,
        reference: booking.reference,
        customerName: booking.customer_name,
        dateLabel: startDate ? formatBookingDates(startDate, 2) : "—",
        expiresAt: new Date(expiresAt).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        hoursLeft,
        totalCents: bookingTotalCents(booking),
        depositCents: depositDueCents(bookingTotalCents(booking)),
      };
    })
    .sort((a, b) => a.hoursLeft - b.hoursLeft)
    .slice(0, limit);
}

export function countExpiringPayments(
  bookings: BookingWithSlot[],
  withinHours = 48
): number {
  const threshold = Date.now() + withinHours * 60 * 60 * 1000;

  return bookings.filter((booking) => {
    if (booking.status !== "awaiting_payment" || !booking.payment_expires_at) {
      return false;
    }

    const expiresMs = new Date(booking.payment_expires_at).getTime();
    return expiresMs <= threshold;
  }).length;
}

export function upcomingPeriodsFromDays(
  days: Parameters<typeof groupAvailabilityByTwoDayPeriod>[0],
  today = todayIsoDate()
) {
  return groupAvailabilityByTwoDayPeriod(days).filter(
    (period) => period.endDate >= today
  );
}

export function sumConfirmedRevenue(
  bookings: BookingWithSlot[],
  today = todayIsoDate()
): number {
  return bookings
    .filter((booking) => {
      const startDate = bookingStartDate(booking);
      return (
        booking.status === "confirmed" &&
        Boolean(startDate) &&
        startDate! >= today
      );
    })
    .reduce((sum, booking) => sum + bookingTotalCents(booking), 0);
}

export function upcomingConfirmedPax(
  bookings: BookingWithSlot[],
  today = todayIsoDate()
): number {
  return bookings
    .filter((booking) => {
      const startDate = bookingStartDate(booking);
      return (
        booking.status === "confirmed" &&
        Boolean(startDate) &&
        startDate! >= today
      );
    })
    .reduce((sum, booking) => sum + booking.headcount, 0);
}
