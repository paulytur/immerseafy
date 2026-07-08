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
} as const;

export const SHARED_AC_ROOM_LABEL = "Shared AC Room";

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
  participantCount: number
): number {
  const count = Math.max(1, participantCount);
  let total = 0;

  if (extras.meals) total += extraLineTotalCents("meals", count, sessionDurationDays);
  if (extras.carpool) total += extraLineTotalCents("carpool", count, sessionDurationDays);
  if (extras.room) total += extraLineTotalCents("room", count, sessionDurationDays);

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
  participantCount = 1
): string {
  const parts: string[] = [];
  const count = Math.max(1, participantCount);
  const peopleLabel = count === 1 ? "1 person" : `${count} people`;

  if (extras.meals) {
    parts.push(
      `Meals ${formatPrice(extraLineTotalCents("meals", count, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.mealsCents)}/person · ${mealsPackageDescription(sessionDurationDays)} · ${peopleLabel})`
    );
  }

  if (extras.carpool) {
    parts.push(
      `Carpool ${formatPrice(extraLineTotalCents("carpool", count, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.carpoolCents)}/person · ${peopleLabel})`
    );
  }

  if (extras.room) {
    parts.push(
      `${SHARED_AC_ROOM_LABEL} ${formatPrice(extraLineTotalCents("room", count, sessionDurationDays))} (${formatPrice(BOOKING_EXTRA_PRICES.roomCents)}/person · ${peopleLabel})`
    );
  } else if (extras.roomDeclineReason) {
    parts.push(`${SHARED_AC_ROOM_LABEL} declined — ${extras.roomDeclineReason}`);
  }

  if (parts.length === 0) return "No add-ons selected";

  return parts.join(" · ");
}

export function getSelectedExtrasDisplay(
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number
): {
  id: string;
  label: string;
  subtitle: string;
  unitLabel: string;
  totalCents: number;
}[] {
  const count = Math.max(1, participantCount);
  const peopleNote = count === 1 ? "1 person" : `${count} people`;
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
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.mealsCents)}/person · ${peopleNote}`,
      totalCents: extraLineTotalCents("meals", count, sessionDurationDays),
    });
  }

  if (extras.carpool) {
    lines.push({
      id: "carpool",
      label: "Carpool",
      subtitle: "Shared ride — we’ll coordinate pickup",
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.carpoolCents)}/person · ${peopleNote}`,
      totalCents: extraLineTotalCents("carpool", count, sessionDurationDays),
    });
  }

  if (extras.room) {
    lines.push({
      id: "room",
      label: SHARED_AC_ROOM_LABEL,
      subtitle: sharedAcRoomSubtitle(sessionDurationDays),
      unitLabel: `${formatPrice(BOOKING_EXTRA_PRICES.roomCents)}/person · ${peopleNote}`,
      totalCents: extraLineTotalCents("room", count, sessionDurationDays),
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
