"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { formatBookingDates } from "@/lib/schedule-utils";
import type { CoachTwoDayPeriod } from "@/lib/schedule-utils";
import type { Coach } from "@/lib/coaches";

type ScheduleAvailabilityListProps = {
  periods: CoachTwoDayPeriod[];
  isAdmin: boolean;
  myCoach: Coach | null;
  acting: string | null;
  onRemove: (coachId: string, startDate: string) => void;
};

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

export default function ScheduleAvailabilityList({
  periods,
  isAdmin,
  myCoach,
  acting,
  onRemove,
}: ScheduleAvailabilityListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, CoachTwoDayPeriod[]>();

    for (const period of periods) {
      const key = monthKey(period.startDate);
      const list = map.get(key) ?? [];
      list.push(period);
      map.set(key, list);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, monthPeriods]) => ({
        key,
        label: monthLabel(monthPeriods[0].startDate),
        periods: monthPeriods,
        coachCount: new Set(
          monthPeriods.flatMap((period) => period.coaches.map((c) => c.id))
        ).size,
      }));
  }, [periods]);

  const currentMonthKey = monthKey(new Date().toISOString().slice(0, 10));
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([currentMonthKey])
  );

  function toggleMonth(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="admin-schedule-list">
      {groups.map((group) => {
        const isOpen = expanded.has(group.key);

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
              <ul className="admin-schedule-rows">
                {group.periods.map((period) => (
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
            )}
          </section>
        );
      })}
    </div>
  );
}
