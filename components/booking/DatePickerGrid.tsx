"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { addDays } from "@/lib/booking-items";
import { formatBookingDates } from "@/lib/schedule-utils";

type DatePickerGridProps = {
  dates: string[];
  selectedDate: string;
  durationDays: 1 | 2;
  onSelect: (date: string) => void;
};

function monthKey(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function formatDateParts(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return {
    weekday: date.toLocaleDateString("en-PH", { weekday: "short" }),
    day: date.getDate(),
    month: date.toLocaleDateString("en-PH", { month: "short" }),
  };
}

function DateCard({
  date,
  durationDays,
  selected,
  onSelect,
}: {
  date: string;
  durationDays: 1 | 2;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const label = formatBookingDates(date, durationDays);

  if (durationDays === 2) {
    const start = formatDateParts(date);
    const end = formatDateParts(addDays(date, 1));

    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={label}
        data-selected={selected}
        onClick={() => onSelect(date)}
        className="booking-date-card booking-date-card-pair"
      >
        <div className="booking-date-pair-side">
          <span className="booking-date-weekday">{start.weekday}</span>
          <span className="booking-date-day">
            {start.day} {start.month}
          </span>
        </div>

        <span className="booking-date-amp">&</span>

        <div className="booking-date-pair-side">
          <span className="booking-date-weekday">{end.weekday}</span>
          <span className="booking-date-day">
            {end.day} {end.month}
          </span>
        </div>
      </button>
    );
  }

  const parts = formatDateParts(date);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      data-selected={selected}
      onClick={() => onSelect(date)}
      className="booking-date-card booking-date-card-single"
    >
      <span className="booking-date-weekday">{parts.weekday}</span>
      <span className="booking-date-day booking-date-day-large">
        {parts.day}
      </span>
      <span className="booking-date-month-label">{parts.month}</span>
    </button>
  );
}

export default function DatePickerGrid({
  dates,
  selectedDate,
  durationDays,
  onSelect,
}: DatePickerGridProps) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const date of dates) {
      const key = monthKey(date);
      const list = map.get(key) ?? [];
      list.push(date);
      map.set(key, list);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, monthDates]) => ({
        key,
        label: monthLabel(monthDates[0]),
        dates: monthDates,
      }));
  }, [dates]);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const date of dates) initial.add(monthKey(date));
    if (selectedDate) initial.add(monthKey(selectedDate));
    return initial;
  });

  function toggleMonth(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (dates.length === 0) {
    return (
      <p className="text-center text-sm text-sand-muted">
        {durationDays === 2
          ? "No consecutive 2-day slots available. Try 1 day or contact us."
          : "No dates match your current selection."}
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={
        durationDays === 2
          ? "Available consecutive date pairs"
          : "Available dates"
      }
      className="booking-date-list"
    >
      {groups.map((group) => {
        const isOpen = expanded.has(group.key);

        return (
          <section key={group.key} className="booking-date-month">
            <button
              type="button"
              onClick={() => toggleMonth(group.key)}
              className="booking-date-month-header"
              aria-expanded={isOpen}
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-sand">{group.label}</p>
                <p className="text-xs text-sand-muted">
                  {group.dates.length} slot{group.dates.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="booking-pill text-[0.6875rem]">
                  {group.dates.length}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-teal transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isOpen && (
              <div className="booking-date-grid border-t border-teal/10 p-2">
                {group.dates.map((date) => (
                  <DateCard
                    key={date}
                    date={date}
                    durationDays={durationDays}
                    selected={selectedDate === date}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
