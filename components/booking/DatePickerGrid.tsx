"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { addDays } from "@/lib/booking-items";
import { formatBookingDates } from "@/lib/schedule-utils";

type DatePickerGridProps = {
  dates: string[];
  selectedDate: string;
  durationDays: 1 | 2;
  onSelect: (date: string) => void;
};

const INITIAL_MONTH_ROWS = 6;

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

function monthShortLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-PH", {
    month: "short",
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
        shortLabel: monthShortLabel(monthDates[0]),
        dates: monthDates,
      }));
  }, [dates]);

  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [monthLimits, setMonthLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    setMonthLimits({});

    if (groups.length === 0) {
      setExpandedMonth(null);
      return;
    }

    const selectedMonth = selectedDate ? monthKey(selectedDate) : null;
    const hasSelectedMonth = selectedMonth
      ? groups.some((group) => group.key === selectedMonth)
      : false;

    setExpandedMonth(hasSelectedMonth ? selectedMonth : groups[0].key);
  }, [dates, durationDays, groups, selectedDate]);

  function handleSelect(date: string) {
    setExpandedMonth(monthKey(date));
    onSelect(date);
  }

  function toggleMonth(key: string) {
    setExpandedMonth((current) => (current === key ? null : key));
  }

  function showMoreInMonth(key: string, total: number) {
    setMonthLimits((prev) => ({
      ...prev,
      [key]: Math.min(
        (prev[key] ?? INITIAL_MONTH_ROWS) + INITIAL_MONTH_ROWS,
        total
      ),
    }));
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

  const soonestDate = dates[0];

  return (
    <div className="booking-date-picker">
      <div className="booking-date-picker-meta">
        <p className="text-xs text-sand-muted">
          {dates.length} available date{dates.length === 1 ? "" : "s"} across{" "}
          {groups.length} month{groups.length === 1 ? "" : "s"}
        </p>

        {!selectedDate && soonestDate ? (
          <button
            type="button"
            onClick={() => handleSelect(soonestDate)}
            className="booking-date-soonest"
          >
            <Sparkles size={13} />
            Pick soonest · {formatBookingDates(soonestDate, durationDays)}
          </button>
        ) : null}
      </div>

      {groups.length > 1 ? (
        <div
          className="booking-date-month-jumps"
          role="tablist"
          aria-label="Jump to month"
        >
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={expandedMonth === group.key}
              onClick={() => setExpandedMonth(group.key)}
              className="booking-date-month-jump"
              data-active={expandedMonth === group.key}
            >
              {group.shortLabel}
              <span className="booking-date-month-jump-count">
                {group.dates.length}
              </span>
            </button>
          ))}
        </div>
      ) : null}

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
          const isOpen = expandedMonth === group.key;
          const visibleLimit = monthLimits[group.key] ?? INITIAL_MONTH_ROWS;
          const visibleDates = group.dates.slice(0, visibleLimit);
          const hiddenCount = group.dates.length - visibleDates.length;

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
                    {group.dates.length} slot
                    {group.dates.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDate && monthKey(selectedDate) === group.key ? (
                    <span className="booking-date-month-selected-pill">
                      Selected
                    </span>
                  ) : null}
                  <ChevronDown
                    size={15}
                    className={`text-teal transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <>
                  <div className="booking-date-grid border-t border-teal/10">
                    {visibleDates.map((date) => (
                      <DateCard
                        key={date}
                        date={date}
                        durationDays={durationDays}
                        selected={selectedDate === date}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>

                  {hiddenCount > 0 ? (
                    <div className="booking-date-show-more-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          showMoreInMonth(group.key, group.dates.length)
                        }
                        className="booking-date-show-more"
                      >
                        Show {Math.min(hiddenCount, INITIAL_MONTH_ROWS)} more in{" "}
                        {group.shortLabel}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
