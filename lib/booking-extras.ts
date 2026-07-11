import { formatPrice } from "@/lib/services-catalog";

export type BookingExtras = {
  meals: boolean;
  carpool: boolean;
  room: boolean;
  roomDeclineReason: string;
};

export type BookingExtraKey = keyof Pick<BookingExtras, "meals" | "carpool" | "room">;

export const BOOKING_EXTRA_PRICES = {
  mealsCents: 90_000,
  carpoolCents: 150_000,
  roomCents: 170_000,
  dayTourFeeCents: 50_000,
} as const;

export const DAY_TOUR_FEE_LABEL = "Day tour fee";

export const SHARED_AC_ROOM_LABEL = "Shared AC Room";

export type BookingLineForExtras = {
  participants?: number;
  quantity?: number;
  participant_names?: string[] | null;
  duration_days?: number;
  durationDays?: number;
};

export function lineHeadcount(item: BookingLineForExtras): number {
  const fromNames = item.participant_names?.length ?? 0;
  const fromField = item.participants ?? item.quantity ?? 0;
  return Math.max(fromNames, fromField, 0);
}

/** Participants billed the day-tour fee (no overnight room). */
export function dayTourParticipantCount(
  items: BookingLineForExtras[],
  sessionDurationDays: 1 | 2
): number {
  if (sessionDurationDays === 1) {
    return items.length > 0 ? bookingGroupHeadcount(items) : 1;
  }

  return items.reduce((sum, item) => {
    const duration = (item.duration_days ?? item.durationDays ?? 2) as 1 | 2;
    return duration === 1 ? sum + lineHeadcount(item) : sum;
  }, 0);
}

/** Participants staying overnight (2-day activity lines on a 2-day trip). */
export function overnightParticipantCount(
  items: BookingLineForExtras[],
  sessionDurationDays: 1 | 2
): number {
  if (sessionDurationDays === 1) return 0;

  const count = items.reduce((sum, item) => {
    const duration = (item.duration_days ?? item.durationDays ?? 2) as 1 | 2;
    return duration === 2 ? sum + lineHeadcount(item) : sum;
  }, 0);

  return count > 0 ? count : bookingGroupHeadcount(items);
}

export function dayTourFeeTotalCents(participantCount: number): number {
  if (participantCount < 1) return 0;
  return BOOKING_EXTRA_PRICES.dayTourFeeCents * participantCount;
}

export function dayTourFeeSubtitle(
  sessionDurationDays: 1 | 2,
  participantCount = 1
): string {
  if (sessionDurationDays === 1) {
    return "Required for 1-day trips without overnight room";
  }

  const peopleLabel =
    participantCount === 1 ? "1 participant" : `${participantCount} participants`;

  return `For ${peopleLabel} on day-only activities without overnight room`;
}

/** Trip length for pricing — prefers stored value, then infers from extras/items. */
export function resolveSessionDurationDays(
  tripDurationDays: 1 | 2 | null | undefined,
  items: { duration_days: number }[],
  extras?: BookingExtras
): 1 | 2 {
  if (tripDurationDays === 1 || tripDurationDays === 2) return tripDurationDays;

  if (extras?.room || extras?.roomDeclineReason) return 2;

  return Math.max(...items.map((item) => item.duration_days), 1) as 1 | 2;
}

export function sharedAcRoomSubtitle(sessionDurationDays: 1 | 2 = 2): string {
  return sessionDurationDays === 2
    ? "Overnight shared air-conditioned room for your 2-day trip"
    : "Overnight shared air-conditioned room";
}

export const DEFAULT_BOOKING_EXTRAS: BookingExtras = {
  meals: false,
  carpool: false,
  room: false,
  roomDeclineReason: "",
};

export function extraUnitPriceCents(key: BookingExtraKey): number {
  if (key === "meals") return BOOKING_EXTRA_PRICES.mealsCents;
  if (key === "carpool") return BOOKING_EXTRA_PRICES.carpoolCents;
  return BOOKING_EXTRA_PRICES.roomCents;
}

export function extraLineTotalCents(
  key: BookingExtraKey,
  participantCount: number,
  _sessionDurationDays: 1 | 2 = 1
): number {
  return extraUnitPriceCents(key) * Math.max(1, participantCount);
}

export function mealsPackageDescription(sessionDurationDays: 1 | 2): string {
  if (sessionDurationDays > 1) {
    return "Day 1: lunch & dinner · Day 2: breakfast";
  }

  return "Lunch & dinner";
}

export function bookingParticipantCount(
  items: { participants?: number; quantity?: number; participant_names?: string[] | null }[]
): number {
  return bookingGroupHeadcount(items);
}

/** Total people across all activity lines (for add-ons billing). */
export function bookingGroupHeadcount(
  items: { participants?: number; quantity?: number; participant_names?: string[] | null }[]
): number {
  if (items.length === 0) return 1;

  const total = items.reduce((sum, item) => {
    const fromNames = item.participant_names?.length ?? 0;
    const fromField = item.participants ?? item.quantity ?? 0;
    return sum + Math.max(fromNames, fromField, 0);
  }, 0);

  return Math.max(total, 1);
}

export function bookingExtrasTotalCents(
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number,
  items: BookingLineForExtras[] = []
): number {
  const groupCount = Math.max(1, participantCount);
  const dayTourCount = dayTourParticipantCount(items, sessionDurationDays);
  const roomCount =
    extras.room && sessionDurationDays === 2
      ? overnightParticipantCount(items, sessionDurationDays)
      : groupCount;
  let total = 0;

  if (extras.meals) total += extraLineTotalCents("meals", groupCount, sessionDurationDays);
  if (extras.carpool) total += extraLineTotalCents("carpool", groupCount, sessionDurationDays);
  if (extras.room && roomCount > 0) {
    total += extraLineTotalCents("room", roomCount, sessionDurationDays);
  }
  if (dayTourCount > 0) {
    total += dayTourFeeTotalCents(dayTourCount);
  }

  return total;
}

export function normalizeBookingExtras(
  input: Partial<BookingExtras> | undefined,
  sessionDurationDays: 1 | 2
): BookingExtras {
  const room =
    sessionDurationDays === 1 ? false : Boolean(input?.room);

  return {
    meals: Boolean(input?.meals),
    carpool: Boolean(input?.carpool),
    room,
    roomDeclineReason: room ? "" : (input?.roomDeclineReason ?? "").trim(),
  };
}

export function validateBookingExtras(
  _extras: BookingExtras,
  _sessionDurationDays: 1 | 2
): string | null {
  return null;
}

export function formatBookingExtrasSummary(
  extras: BookingExtras,
  sessionDurationDays: 1 | 2 = 1,
  participantCount = 1,
  items: BookingLineForExtras[] = []
): string {
  const parts: string[] = [];
  const groupCount = Math.max(1, participantCount);
  const groupLabel = groupCount === 1 ? "1 person" : `${groupCount} people`;
  const dayTourCount = dayTourParticipantCount(items, sessionDurationDays);
  const roomCount =
    extras.room && sessionDurationDays === 2
      ? overnightParticipantCount(items, sessionDurationDays)
      : groupCount;
  const roomLabel = roomCount === 1 ? "1 person" : `${roomCount} people`;
  const dayTourLabel = dayTourCount === 1 ? "1 person" : `${dayTourCount} people`;

  if (extras.meals) {
    parts.push(
      `Meals ${formatPrice(extraLineTotalCents("meals", groupCount, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.mealsCents)}/person · ${mealsPackageDescription(sessionDurationDays)} · ${groupLabel})`
    );
  }

  if (extras.carpool) {
    parts.push(
      `Carpool ${formatPrice(extraLineTotalCents("carpool", groupCount, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.carpoolCents)}/person · ${groupLabel})`
    );
  }

  if (extras.room && roomCount > 0) {
    parts.push(
      `${SHARED_AC_ROOM_LABEL} ${formatPrice(extraLineTotalCents("room", roomCount, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.roomCents)}/person · ${roomLabel})`
    );
  } else if (extras.roomDeclineReason) {
    parts.push(`${SHARED_AC_ROOM_LABEL} declined — ${extras.roomDeclineReason}`);
  }

  if (dayTourCount > 0) {
    parts.push(
      `${DAY_TOUR_FEE_LABEL} ${formatPrice(dayTourFeeTotalCents(dayTourCount))} (${formatPrice(BOOKING_EXTRA_PRICES.dayTourFeeCents)}/person · ${dayTourLabel})`
    );
  }

  if (parts.length === 0) return "No add-ons selected";

  return parts.join(" · ");
}

export function getSelectedExtrasDisplay(
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number,
  items: BookingLineForExtras[] = []
): {
  id: string;
  label: string;
  subtitle: string;
  unitLabel: string;
  totalCents: number;
}[] {
  const groupCount = Math.max(1, participantCount);
  const groupNote = groupCount === 1 ? "1 person" : `${groupCount} people`;
  const dayTourCount = dayTourParticipantCount(items, sessionDurationDays);
  const roomCount =
    extras.room && sessionDurationDays === 2
      ? overnightParticipantCount(items, sessionDurationDays)
      : groupCount;
  const roomNote = roomCount === 1 ? "1 person" : `${roomCount} people`;
  const dayTourNote = dayTourCount === 1 ? "1 person" : `${dayTourCount} people`;
  const lines: {
    id: string;
    label: string;
    subtitle: string;
    unitLabel: string;
    totalCents: number;
  }[] = [];

  if (extras.meals) {
    lines.push({
      id: "meals",
      label: "Meals",
      subtitle: mealsPackageDescription(sessionDurationDays),
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.mealsCents)}/person · ${groupNote}`,
      totalCents: extraLineTotalCents("meals", groupCount, sessionDurationDays),
    });
  }

  if (extras.carpool) {
    lines.push({
      id: "carpool",
      label: "Carpool",
      subtitle: "Shared ride — we’ll coordinate pickup",
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.carpoolCents)}/person · ${groupNote}`,
      totalCents: extraLineTotalCents("carpool", groupCount, sessionDurationDays),
    });
  }

  if (extras.room && roomCount > 0) {
    lines.push({
      id: "room",
      label: SHARED_AC_ROOM_LABEL,
      subtitle: sharedAcRoomSubtitle(sessionDurationDays),
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.roomCents)}/person · ${roomNote}`,
      totalCents: extraLineTotalCents("room", roomCount, sessionDurationDays),
    });
  } else if (extras.roomDeclineReason) {
    lines.push({
      id: "room-declined",
      label: `${SHARED_AC_ROOM_LABEL} declined`,
      subtitle: extras.roomDeclineReason,
      unitLabel: "",
      totalCents: 0,
    });
  }

  if (dayTourCount > 0) {
    lines.push({
      id: "day-tour-fee",
      label: DAY_TOUR_FEE_LABEL,
      subtitle: dayTourFeeSubtitle(sessionDurationDays, dayTourCount),
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.dayTourFeeCents)}/person · ${dayTourNote}`,
      totalCents: dayTourFeeTotalCents(dayTourCount),
    });
  }

  return lines;
}

export function extrasFromBookingRecord(booking: {
  meals_requested?: boolean | null;
  carpool_requested?: boolean | null;
  room_requested?: boolean | null;
  room_decline_reason?: string | null;
}): BookingExtras {
  return {
    meals: booking.meals_requested ?? false,
    carpool: booking.carpool_requested ?? false,
    room: booking.room_requested ?? false,
    roomDeclineReason: booking.room_decline_reason ?? "",
  };
}
