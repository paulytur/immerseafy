"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
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

const INITIAL_MONTH_ROWS = 6;

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

  const currentMonthKey = monthKey(today);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([currentMonthKey])
  );
  const [monthLimits, setMonthLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    setMonthLimits({});
    const groupKeys = groups.map((group) => group.key);

    if (view === "past") {
      setExpanded(new Set(groupKeys.slice(0, 1)));
      return;
    }

    const defaultKeys = groupKeys.filter((key) => key === currentMonthKey);
    setExpanded(new Set(defaultKeys.length > 0 ? defaultKeys : groupKeys.slice(0, 1)));
  }, [view, coachFilterId, query, currentMonthKey, groups]);

  function toggleMonth(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(groups.map((group) => group.key)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

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

  const allExpanded = groups.every((group) => expanded.has(group.key));

  return (
    <div className="space-y-3">
      {groups.length > 1 && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={allExpanded ? collapseAll : expandAll}
            className="admin-schedule-list-action"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}

      <div className="admin-schedule-list">
        {groups.map((group) => {
          const isOpen = expanded.has(group.key);
          const visibleLimit = monthLimits[group.key] ?? INITIAL_MONTH_ROWS;
          const visiblePeriods = group.periods.slice(0, visibleLimit);
          const hiddenCount = group.periods.length - visiblePeriods.length;

          return (
            <section key={group.key} className="admin-schedule-month">
              <button
                type="button"
                onClick={() => toggleMonth(group.key)}
                className="admin-schedule-month-header"
                aria-expanded={isOpen}
              >
                <div className="min-w-0 text-left">
                  <p className="font-display text-sm font-semibold text-sand">
                    {group.label}
                  </p>
                  <p className="text-xs text-sand-muted">
                    {group.periods.length} block
                    {group.periods.length === 1 ? "" : "s"} · {group.coachCount}{" "}
                    coach{group.coachCount === 1 ? "" : "es"}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-teal transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <>
                  <ul className="admin-schedule-rows">
                    {visiblePeriods.map((period) => (
                      <li key={period.startDate} className="admin-schedule-row">
                        <div className="admin-schedule-row-date">
                          <p className="font-medium text-sand">
                            {formatBookingDates(period.startDate, 2)}
                          </p>
                          <p className="text-xs text-sand-muted">
                            {period.coaches.length} on deck
                          </p>
                        </div>

                        <div className="admin-schedule-row-coaches">
                          {period.coaches.map((coach) => {
                            const canRemove =
                              isAdmin || (myCoach && myCoach.id === coach.id);
                            const busy =
                              acting === `${coach.id}-${period.startDate}`;

                            return (
                              <span
                                key={coach.id}
                                className="admin-coach-chip"
                                title={coach.name}
                              >
                                <span className="admin-coach-chip-initials">
                                  {coachInitials(coach.name)}
                                </span>
                                <span className="admin-coach-chip-name">
                                  {coach.name.split(" ")[0]}
                                </span>
                                {canRemove && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    aria-label={`Remove ${coach.name} from ${formatBookingDates(period.startDate, 2)}`}
                                    onClick={() =>
                                      onRemove(coach.id, period.startDate)
                                    }
                                    className="admin-coach-chip-remove"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {hiddenCount > 0 && (
                    <div className="admin-schedule-show-more-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          showMoreInMonth(group.key, group.periods.length)
                        }
                        className="admin-schedule-show-more"
                      >
                        Show {Math.min(hiddenCount, INITIAL_MONTH_ROWS)} more in{" "}
                        {group.label.split(" ")[0]}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
