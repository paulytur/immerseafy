"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  comparePeriodsByNearestDate,
  formatBookingDates,
  isUpcomingPeriod,
  todayIsoDate,
} from "@/lib/schedule-utils";
import type { CoachTwoDayPeriod } from "@/lib/schedule-utils";
import type { Coach } from "@/lib/coaches";

export type ScheduleView = "upcoming" | "past" | "all";

type ScheduleAvailabilityListProps = {
  periods: CoachTwoDayPeriod[];
  isAdmin: boolean;
  myCoach: Coach | null;
  acting: string | null;
  onRemove: (coachId: string, startDate: string) => void;
  search?: string;
  view?: ScheduleView;
  coachFilterId?: string;
};

const INITIAL_MONTH_ROWS = 8;

const TABLE_COLUMNS = [
  { key: "dates", label: "Dates", className: "col-dates" },
  { key: "coaches", label: "Coaches", className: "col-coaches" },
  { key: "count", label: "Count", className: "col-count" },
  { key: "actions", label: "Actions", className: "col-actions" },
] as const;

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function monthKey(startDate: string) {
  const date = new Date(`${startDate}T12:00:00`);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(startDate: string) {
  return new Date(`${startDate}T12:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function matchesSearch(period: CoachTwoDayPeriod, query: string) {
  if (!query) return true;

  const haystack = [
    formatBookingDates(period.startDate, 2),
    period.startDate,
    period.endDate,
    ...period.coaches.map((coach) => coach.name),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function ScheduleTableHeader() {
  return (
    <div className="admin-schedule-table-head" role="row">
      {TABLE_COLUMNS.map((column) => (
        <span
          key={column.key}
          className={`admin-schedule-table-head-cell ${column.className}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

function ScheduleRow({
  period,
  isAdmin,
  myCoach,
  acting,
  onRemove,
}: {
  period: CoachTwoDayPeriod;
  isAdmin: boolean;
  myCoach: Coach | null;
  acting: string | null;
  onRemove: (coachId: string, startDate: string) => void;
}) {
  const removableCoaches = period.coaches.filter(
    (coach) => isAdmin || (myCoach && myCoach.id === coach.id)
  );

  return (
    <article className="admin-schedule-table-row">
      <div className="admin-schedule-table-row-grid" role="row">
        <div className="admin-schedule-table-cell col-dates">
          <span className="admin-booking-highlight">
            {formatBookingDates(period.startDate, 2)}
          </span>
        </div>

        <div className="admin-schedule-table-cell col-coaches">
          <div className="admin-schedule-table-coaches">
            {period.coaches.map((coach) => (
              <span key={coach.id} className="admin-coach-chip" title={coach.name}>
                <span className="admin-coach-chip-initials">
                  {coachInitials(coach.name)}
                </span>
                <span className="admin-coach-chip-name">
                  {coach.name.split(" ")[0]}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="admin-schedule-table-cell col-count">
          <span className="admin-booking-highlight-pill">
            {period.coaches.length}
          </span>
        </div>

        <div className="admin-schedule-table-cell col-actions">
          {removableCoaches.length > 0 ? (
            <div className="admin-booking-actions">
              {removableCoaches.map((coach) => {
                const busy = acting === `${coach.id}-${period.startDate}`;

                return (
                  <button
                    key={coach.id}
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${coach.name} from ${formatBookingDates(period.startDate, 2)}`}
                    onClick={() => onRemove(coach.id, period.startDate)}
                    className="admin-booking-btn"
                  >
                    {busy ? "…" : `Remove ${coach.name.split(" ")[0]}`}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="admin-booking-actions-empty">—</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ScheduleAvailabilityList({
  periods,
  isAdmin,
  myCoach,
  acting,
  onRemove,
  search = "",
  view = "upcoming",
  coachFilterId = "",
}: ScheduleAvailabilityListProps) {
  const today = todayIsoDate();
  const query = search.trim().toLowerCase();

  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      if (coachFilterId && !period.coaches.some((c) => c.id === coachFilterId)) {
        return false;
      }

      if (view === "upcoming" && !isUpcomingPeriod(period, today)) return false;
      if (view === "past" && isUpcomingPeriod(period, today)) return false;

      return matchesSearch(period, query);
    });
  }, [periods, coachFilterId, view, today, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CoachTwoDayPeriod[]>();

    for (const period of filteredPeriods) {
      const key = monthKey(period.startDate);
      const list = map.get(key) ?? [];
      list.push(period);
      map.set(key, list);
    }

    return Array.from(map.entries())
      .map(([key, monthPeriods]) => {
        const sorted = [...monthPeriods].sort((a, b) =>
          comparePeriodsByNearestDate(a, b, today)
        );

        return {
          key,
          label: monthLabel(sorted[0].startDate),
          periods: sorted,
          coachCount: new Set(
            sorted.flatMap((period) => period.coaches.map((c) => c.id))
          ).size,
        };
      })
      .sort((a, b) =>
        comparePeriodsByNearestDate(a.periods[0], b.periods[0], today)
      );
  }, [filteredPeriods, today]);

  const [monthLimits, setMonthLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    setMonthLimits({});
  }, [view, coachFilterId, query]);

  function showMoreInMonth(key: string, total: number) {
    setMonthLimits((prev) => ({
      ...prev,
      [key]: Math.min((prev[key] ?? INITIAL_MONTH_ROWS) + INITIAL_MONTH_ROWS, total),
    }));
  }

  if (groups.length === 0) {
    if (periods.length === 0) return null;

    return (
      <p className="rounded-lg border border-teal/15 bg-ocean-mid/20 px-4 py-6 text-center text-sm text-sand-muted">
        {search || coachFilterId
          ? "No blocks match your search or coach filter."
          : view === "upcoming"
            ? "No upcoming blocks. Switch to Past or All to see older dates."
            : "No past blocks yet."}
      </p>
    );
  }

  return (
    <div className="admin-schedule-table-list">
      {groups.map((group) => {
        const visibleLimit = monthLimits[group.key] ?? INITIAL_MONTH_ROWS;
        const visiblePeriods = group.periods.slice(0, visibleLimit);
        const hiddenCount = group.periods.length - visiblePeriods.length;

        return (
          <section
            key={group.key}
            className="admin-schedule-month admin-bookings-panel"
          >
            <div className="admin-bookings-month-head">
              <p className="admin-bookings-month-title">{group.label}</p>
              <p className="admin-bookings-month-meta">
                {group.periods.length} block
                {group.periods.length === 1 ? "" : "s"} · {group.coachCount}{" "}
                coach{group.coachCount === 1 ? "" : "es"}
              </p>
            </div>

            <div className="admin-schedule-table-wrap">
              <ScheduleTableHeader />
              <div className="admin-schedule-table-body">
                {visiblePeriods.map((period) => (
                  <ScheduleRow
                    key={period.startDate}
                    period={period}
                    isAdmin={isAdmin}
                    myCoach={myCoach}
                    acting={acting}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>

            {hiddenCount > 0 ? (
              <div className="admin-schedule-show-more-wrap">
                <button
                  type="button"
                  onClick={() => showMoreInMonth(group.key, group.periods.length)}
                  className="admin-schedule-show-more"
                >
                  Show {Math.min(hiddenCount, INITIAL_MONTH_ROWS)} more in{" "}
                  {group.label.split(" ")[0]}
                </button>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
