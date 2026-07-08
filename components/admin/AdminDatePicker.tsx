"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/lib/dates";
import { formatBookingDates } from "@/lib/schedule-utils";

type AdminDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Highlight start + next day as a 2-day block */
  twoDayBlock?: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

export default function AdminDatePicker({
  label,
  value,
  onChange,
  disabled = false,
  twoDayBlock = false,
}: AdminDatePickerProps) {
  const today = todayString();
  const initial = value ? new Date(`${value}T12:00:00`) : new Date(`${today}T12:00:00`);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const endDate = value && twoDayBlock ? addDays(value, 1) : "";

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1, 12, 0, 0);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leading = firstDay.getDay();
    const items: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < leading; i++) {
      items.push({ date: null, day: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      items.push({
        date: toDateString(viewYear, viewMonth, day),
        day,
      });
    }

    return items;
  }, [viewMonth, viewYear]);

  function goMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1, 12, 0, 0);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <label className="form-label">{label}</label>

      <div className="admin-datepicker">
        <div className="admin-datepicker-header">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => goMonth(-1)}
            className="admin-datepicker-nav"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="font-display text-sm font-semibold text-sand">
            {monthLabel(viewYear, viewMonth)}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => goMonth(1)}
            className="admin-datepicker-nav"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="admin-datepicker-weekdays">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div
          role="grid"
          aria-label={label}
          className="admin-datepicker-grid"
        >
          {cells.map((cell, index) => {
            if (!cell.date || cell.day === null) {
              return <span key={`empty-${index}`} className="admin-datepicker-day-empty" />;
            }

            const isStart = value === cell.date;
            const isEnd = endDate === cell.date;
            const inBlock = twoDayBlock && (isStart || isEnd);
            const isPast = cell.date < today;

            return (
              <button
                key={cell.date}
                type="button"
                role="gridcell"
                disabled={isPast}
                aria-selected={isStart}
                aria-label={cell.date}
                data-selected={isStart}
                data-in-block={inBlock}
                data-block-end={isEnd}
                data-past={isPast}
                onClick={() => onChange(cell.date!)}
                className="admin-datepicker-day"
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {value && twoDayBlock && (
          <p className="admin-datepicker-preview">
            {formatBookingDates(value, 2)}
          </p>
        )}
      </div>
    </div>
  );
}
