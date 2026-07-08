import { addDays } from "@/lib/dates";
import {
  SESSION_SERVICE_SLUGS,
  CERTIFICATION_SERVICE_SLUGS,
  SESSION_SERVICES,
  getServiceBySlug,
} from "@/lib/services-catalog";
import type { Coach, CoachDay } from "@/lib/coaches";
import type { SessionSlot } from "@/lib/types";

export type CoachTwoDayPeriod = {
  startDate: string;
  endDate: string;
  coaches: Coach[];
};

/** Coaches available on both days of a consecutive pair. */
export function groupAvailabilityByTwoDayPeriod(
  days: CoachDay[]
): CoachTwoDayPeriod[] {
  const byDate = new Map(days.map((d) => [d.date, d.coaches]));
  const periods: CoachTwoDayPeriod[] = [];
  const seen = new Set<string>();

  for (const { date: startDate } of days) {
    const endDate = addDays(startDate, 1);
    const key = `${startDate}:${endDate}`;
    if (seen.has(key)) continue;

    const startCoaches = byDate.get(startDate);
    const endCoaches = byDate.get(endDate);
    if (!startCoaches?.length || !endCoaches?.length) continue;

    seen.add(key);

    const coaches = startCoaches.filter((coach) =>
      endCoaches.some((other) => other.id === coach.id)
    );
    if (!coaches.length) continue;

    periods.push({
      startDate,
      endDate,
      coaches: coaches.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return periods.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromScheduleDate(
  dateStr: string,
  today = todayIsoDate()
): number {
  const todayDate = new Date(`${today}T12:00:00`);
  const date = new Date(`${dateStr}T12:00:00`);
  return Math.round((date.getTime() - todayDate.getTime()) / 86_400_000);
}

export function isUpcomingPeriod(
  period: CoachTwoDayPeriod,
  today = todayIsoDate()
): boolean {
  return period.endDate >= today;
}

/** Upcoming dates first (soonest at top), then past dates (most recent past first). */
export function comparePeriodsByNearestDate(
  a: CoachTwoDayPeriod,
  b: CoachTwoDayPeriod,
  today = todayIsoDate()
): number {
  const daysA = daysFromScheduleDate(a.startDate, today);
  const daysB = daysFromScheduleDate(b.startDate, today);
  const aUpcoming = daysA >= 0;
  const bUpcoming = daysB >= 0;

  if (aUpcoming && !bUpcoming) return -1;
  if (!aUpcoming && bUpcoming) return 1;
  if (aUpcoming && bUpcoming) return daysA - daysB;

  return daysB - daysA;
}

/** Earliest upcoming date from schedule blocks and/or booking start dates. */
export function findNearestUpcomingDate(
  periods: CoachTwoDayPeriod[],
  bookingDates: string[],
  today: string
): string | null {
  const dates = [
    ...periods.map((period) => period.startDate),
    ...bookingDates,
  ]
    .filter((date) => date >= today)
    .sort();

  return dates[0] ?? null;
}

export function dateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || endDate < startDate) return [];

  const dates: string[] = [];
  let current = startDate;

  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

export function expandDatesForTwoDayServices(
  dates: string[],
  serviceSlugs: string[] = SESSION_SERVICE_SLUGS
): string[] {
  const expanded = new Set(dates);

  for (const date of dates) {
    for (const slug of serviceSlugs) {
      const service = getServiceBySlug(slug);
      if (service?.allowedDurations.includes(2)) {
        expanded.add(addDays(date, 1));
      }
    }
  }

  return Array.from(expanded).sort();
}

export type SessionDaySummary = {
  date: string;
  slots: SessionSlot[];
  maxSlots: number;
  totalBooked: number;
  hasBookings: boolean;
  isComplete: boolean;
};

export function buildSessionDays(slots: SessionSlot[]): SessionDaySummary[] {
  const sessionSlots = slots.filter((s) =>
    SESSION_SERVICE_SLUGS.includes(s.service_slug)
  );
  const map = new Map<string, SessionSlot[]>();

  for (const slot of sessionSlots) {
    const list = map.get(slot.date) ?? [];
    list.push(slot);
    map.set(slot.date, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySlots]) => {
      const present = new Set(daySlots.map((s) => s.service_slug));
      const isComplete = SESSION_SERVICE_SLUGS.every((slug) =>
        present.has(slug)
      );

      return {
        date,
        slots: daySlots,
        maxSlots: daySlots[0]?.max_slots ?? 0,
        totalBooked: daySlots.reduce((sum, s) => sum + s.booked_count, 0),
        hasBookings: daySlots.some((s) => s.booked_count > 0),
        isComplete,
      };
    });
}

export type SessionPeriod = {
  startDate: string;
  endDate: string;
  dates: string[];
  days: SessionDaySummary[];
  label: string;
  hasBookings: boolean;
};

export function groupSessionPeriods(days: SessionDaySummary[]): SessionPeriod[] {
  if (days.length === 0) return [];

  const periods: SessionPeriod[] = [];
  let currentDates: string[] = [days[0].date];
  let currentDays: SessionDaySummary[] = [days[0]];

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1].date;
    const next = days[i].date;
    const isConsecutive = addDays(prev, 1) === next;

    if (isConsecutive) {
      currentDates.push(next);
      currentDays.push(days[i]);
    } else {
      periods.push(buildPeriod(currentDates, currentDays));
      currentDates = [next];
      currentDays = [days[i]];
    }
  }

  periods.push(buildPeriod(currentDates, currentDays));
  return periods;
}

function buildPeriod(
  dates: string[],
  days: SessionDaySummary[]
): SessionPeriod {
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const label =
    dates.length === 1
      ? formatScheduleDate(startDate)
      : `${formatScheduleDate(startDate)} – ${formatScheduleDate(endDate)}`;

  return {
    startDate,
    endDate,
    dates,
    days,
    label,
    hasBookings: days.some((d) => d.hasBookings),
  };
}

export function formatScheduleDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function formatBookingDates(
  startDate: string,
  durationDays: 1 | 2
): string {
  if (!startDate) return "";
  if (durationDays === 1) return formatShortDate(startDate);
  return `${formatShortDate(startDate)} & ${formatShortDate(addDays(startDate, 1))}`;
}

export function sessionCoursesLabel(): string {
  return SESSION_SERVICES.map((s) => s.title).join(" · ");
}

export function getCertificationSlots(slots: SessionSlot[]): SessionSlot[] {
  return slots
    .filter((s) => CERTIFICATION_SERVICE_SLUGS.includes(s.service_slug))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.service_slug.localeCompare(b.service_slug)
    );
}

export function getTwoDayScheduleWarnings(
  date: string,
  daySlots: SessionSlot[],
  allSlots: SessionSlot[]
): string[] {
  const warnings: string[] = [];

  for (const service of SESSION_SERVICES.filter((s) =>
    s.allowedDurations.includes(2)
  )) {
    if (!daySlots.some((s) => s.service_slug === service.slug)) continue;

    const nextDate = addDays(date, 1);
    const hasFollowUp = allSlots.some(
      (s) => s.service_slug === service.slug && s.date === nextDate
    );

    if (!hasFollowUp) {
      warnings.push(
        `2-day ${service.title} bookings need a session on ${formatScheduleDate(nextDate)} too`
      );
    }
  }

  return warnings;
}
