import {
  formatItemLabel,
  bookingItemLineTotalCents,
  type ResolvedBookingItem,
} from "@/lib/booking-items";
import {
  getSelectedExtrasDisplay,
  type BookingExtras,
} from "@/lib/booking-extras";

export type BreakdownLine = {
  label: string;
  subtitle?: string;
  amountCents: number;
};

function appendExtrasLines(
  lines: BreakdownLine[],
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number
) {
  for (const extra of getSelectedExtrasDisplay(
    extras,
    sessionDurationDays,
    participantCount
  )) {
    lines.push({
      label: extra.label,
      subtitle: extra.subtitle,
      amountCents: extra.totalCents,
    });
  }
}

export function breakdownLinesFromResolved(
  items: ResolvedBookingItem[],
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number
): BreakdownLine[] {
  const lines: BreakdownLine[] = items.map((item) => ({
    label: formatItemLabel({
      serviceSlug: item.serviceSlug,
      durationDays: item.durationDays,
      participantNames: item.participantNames,
      quantity: item.quantity,
      participants: item.participants,
    }),
    amountCents: item.lineTotalCents,
  }));

  appendExtrasLines(lines, extras, sessionDurationDays, participantCount);
  return lines;
}

export function breakdownLinesFromDbItems(
  items: {
    service_slug: string;
    quantity: number;
    unit_price_cents: number;
    participant_names?: string[] | null;
    duration_days: number;
  }[],
  extras: BookingExtras,
  sessionDurationDays: 1 | 2,
  participantCount: number
): BreakdownLine[] {
  const lines: BreakdownLine[] = items.map((item) => ({
    label: formatItemLabel({
      serviceSlug: item.service_slug,
      durationDays: item.duration_days,
      participantNames: item.participant_names ?? undefined,
      quantity: item.quantity,
    }),
    amountCents: bookingItemLineTotalCents(item),
  }));

  appendExtrasLines(lines, extras, sessionDurationDays, participantCount);
  return lines;
}
