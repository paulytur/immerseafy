"use client";

import { useMemo, useState, type MouseEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  FileDown,
  Mail,
  Phone,
} from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatPrice, getServiceBySlug } from "@/lib/services-catalog";
import { paymentBreakdown } from "@/lib/payment-amounts";
import {
  formatItemLabel,
  bookingItemLineTotalCents,
} from "@/lib/booking-items";
import {
  bookingExtrasTotalCents,
  bookingParticipantCount,
  extrasFromBookingRecord,
  getSelectedExtrasDisplay,
  resolveSessionDurationDays,
} from "@/lib/booking-extras";
import { formatBookingDates } from "@/lib/schedule-utils";
import type { BookingStatus, BookingWithSlot } from "@/lib/types";

type BookingsListProps = {
  bookings: BookingWithSlot[];
  acting: string | null;
  onAction: (id: string, action: string) => void;
  groupByMonth?: boolean;
};

const STATUS_ACCENT: Record<BookingStatus, string> = {
  pending: "admin-booking-accent-pending",
  awaiting_payment: "admin-booking-accent-awaiting",
  confirmed: "admin-booking-accent-confirmed",
  expired: "admin-booking-accent-expired",
  cancelled: "admin-booking-accent-cancelled",
};

const TABLE_COLUMNS = [
  { key: "status", label: "Status", className: "col-status" },
  { key: "guest", label: "Guest", className: "col-guest" },
  { key: "course", label: "Course", className: "col-course" },
  { key: "date", label: "Date", className: "col-date" },
  { key: "pax", label: "Guests", className: "col-pax" },
  { key: "total", label: "Total", className: "col-total" },
  { key: "ref", label: "Reference", className: "col-ref" },
  { key: "expand", label: "", className: "col-expand" },
  { key: "actions", label: "Actions", className: "col-actions" },
] as const;

function formatCourseLabel(booking: BookingWithSlot) {
  const items = booking.booking_items ?? [];
  const slot = booking.session_slots;

  if (items.length > 0) {
    return items
      .map((item) => {
        const service = getServiceBySlug(item.service_slug);
        return service?.title ?? item.service_slug;
      })
      .join(" · ");
  }

  if (slot) {
    const service = getServiceBySlug(slot.service_slug);
    return service?.title ?? slot.service_slug;
  }

  return "—";
}

function monthKey(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}`;
}

function monthLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function bookingSortDate(booking: BookingWithSlot) {
  return (
    booking.start_date ??
    booking.booking_items?.[0]?.start_date ??
    booking.session_slots?.date ??
    booking.created_at.slice(0, 10)
  );
}

function daysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const date = new Date(`${dateStr}T12:00:00`);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

/** Upcoming dates first (soonest at top), then past dates (most recent past first). */
function compareByNearestDate(a: BookingWithSlot, b: BookingWithSlot) {
  const daysA = daysFromToday(bookingSortDate(a));
  const daysB = daysFromToday(bookingSortDate(b));
  const aUpcoming = daysA >= 0;
  const bUpcoming = daysB >= 0;

  if (aUpcoming && !bUpcoming) return -1;
  if (!aUpcoming && bUpcoming) return 1;
  if (aUpcoming && bUpcoming) return daysA - daysB;

  return daysB - daysA;
}

function statusPriority(status: BookingStatus) {
  if (status === "pending") return 0;
  if (status === "awaiting_payment") return 1;
  if (status === "confirmed") return 2;
  return 3;
}

function getBookingDetails(booking: BookingWithSlot) {
  const items = booking.booking_items ?? [];
  const slot = booking.session_slots;
  const extras = extrasFromBookingRecord(booking);
  const sessionDurationDays = resolveSessionDurationDays(
    booking.trip_duration_days,
    items,
    extras
  );
  const participantCount = bookingParticipantCount(items);
  const startDate = bookingSortDate(booking);

  const activityLines =
    items.length > 0
      ? items.map((item) => ({
          id: item.id,
          label: formatItemLabel({
            serviceSlug: item.service_slug,
            participantNames: item.participant_names,
            quantity: item.quantity,
            durationDays: item.duration_days,
          }),
          amountCents: bookingItemLineTotalCents(item),
        }))
      : slot
        ? [
            {
              id: slot.id,
              label: formatItemLabel({
                serviceSlug: slot.service_slug,
                quantity: booking.headcount,
                durationDays: 1,
              }),
              amountCents: slot.price_cents * booking.headcount,
            },
          ]
        : [];

  const coursesTotal = activityLines.reduce(
    (sum, line) => sum + line.amountCents,
    0
  );
  const total =
    coursesTotal +
    bookingExtrasTotalCents(extras, sessionDurationDays, participantCount, items);
  const { depositCents, balanceCents } = paymentBreakdown(total);

  return {
    courseLabel: formatCourseLabel(booking),
    guestCount: participantCount,
    dateLabel: startDate ? formatBookingDates(startDate, sessionDurationDays) : "—",
    total,
    depositCents,
    balanceCents,
    activityLines,
    extrasLines: getSelectedExtrasDisplay(
      extras,
      sessionDurationDays,
      participantCount,
      items
    ),
    submittedAt: new Date(booking.created_at).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    paymentExpiresAt: booking.payment_expires_at
      ? new Date(booking.payment_expires_at).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null,
  };
}

function BookingsTableHeader() {
  return (
    <div className="admin-bookings-head" role="row">
      {TABLE_COLUMNS.map((column) => (
        <span
          key={column.key}
          className={`admin-bookings-head-cell ${column.className}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

function CopyReferenceButton({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  async function copyReference(event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyReference}
      className="admin-booking-copy-ref"
      aria-label="Copy booking reference"
    >
      <Copy size={11} />
      {copied ? "Copied" : reference}
    </button>
  );
}

function BookingRowActions({
  booking,
  busy,
  onAction,
}: {
  booking: BookingWithSlot;
  busy: boolean;
  onAction: (id: string, action: string) => void;
}) {
  function run(event: MouseEvent, action: string) {
    event.stopPropagation();
    onAction(booking.id, action);
  }

  if (booking.status === "pending") {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => run(event, "approve")}
          className="admin-booking-btn admin-booking-btn-primary"
        >
          {busy ? "…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => run(event, "reject")}
          className="admin-booking-btn"
        >
          Reject
        </button>
      </>
    );
  }

  if (booking.status === "awaiting_payment") {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => run(event, "confirm_payment")}
          className="admin-booking-btn admin-booking-btn-primary"
        >
          {busy ? "…" : "Confirm deposit"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => run(event, "resend_payment_email")}
          className="admin-booking-btn"
        >
          {busy ? "…" : "Resend email"}
        </button>
      </>
    );
  }

  return <span className="admin-booking-actions-empty">—</span>;
}

function BookingRow({
  booking,
  acting,
  onAction,
}: {
  booking: BookingWithSlot;
  acting: string | null;
  onAction: (id: string, action: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const details = getBookingDetails(booking);
  const busy = acting === booking.id;
  const summaryPdfUrl = `/api/bookings/summary?${new URLSearchParams({
    ref: booking.reference,
    token: booking.payment_token,
  }).toString()}`;

  function toggleExpanded(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest(".col-actions")) return;
    setExpanded((current) => !current);
  }

  return (
    <article
      className={`admin-booking-row ${STATUS_ACCENT[booking.status]}`}
      data-status={booking.status}
    >
      <div
        className="admin-booking-row-grid"
        role="row"
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        tabIndex={0}
      >
        <div className="admin-booking-cell col-status" data-label="Status">
          <StatusBadge status={booking.status} compact />
        </div>
        <div className="admin-booking-cell col-guest" data-label="Guest">
          {booking.customer_name}
        </div>
        <div className="admin-booking-cell col-course" data-label="Course">
          <span className="admin-booking-highlight" title={details.courseLabel}>
            {details.courseLabel}
          </span>
        </div>
        <div className="admin-booking-cell col-date" data-label="Date">
          <span className="admin-booking-highlight">{details.dateLabel}</span>
        </div>
        <div className="admin-booking-cell col-pax" data-label="Guests">
          <span className="admin-booking-highlight-pill">
            {details.guestCount}{" "}
            {details.guestCount === 1 ? "guest" : "guests"}
          </span>
        </div>
        <div className="admin-booking-cell col-total" data-label="Total">
          {booking.status === "awaiting_payment" ? (
            <span className="admin-booking-total-stack">
              <span>{formatPrice(details.total)}</span>
              <span className="admin-booking-total-sub">
                Deposit {formatPrice(details.depositCents)}
              </span>
            </span>
          ) : (
            formatPrice(details.total)
          )}
        </div>
        <div className="admin-booking-cell col-ref" data-label="Reference">
          {booking.reference}
        </div>
        <div className="admin-booking-cell col-expand" data-label="">
          {expanded ? (
            <ChevronUp size={14} className="admin-booking-chevron" />
          ) : (
            <ChevronDown size={14} className="admin-booking-chevron" />
          )}
        </div>
        <div className="admin-booking-cell col-actions" data-label="Actions">
          <div className="admin-booking-actions">
            <BookingRowActions booking={booking} busy={busy} onAction={onAction} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="admin-booking-expand">
          <div className="admin-booking-details-bar">
            <a href={`mailto:${booking.customer_email}`} className="admin-booking-link">
              <Mail size={12} />
              {booking.customer_email}
            </a>
            <a href={`tel:${booking.customer_phone}`} className="admin-booking-link">
              <Phone size={12} />
              {booking.customer_phone}
            </a>
            <CopyReferenceButton reference={booking.reference} />
            <a
              href={summaryPdfUrl}
              className="admin-booking-download"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <FileDown size={12} />
              PDF
            </a>
            {details.paymentExpiresAt && booking.status === "awaiting_payment" ? (
              <span className="admin-booking-expiry">
                Deposit due by {details.paymentExpiresAt}
              </span>
            ) : null}
          </div>

          <ul className="admin-booking-line-list">
            {details.activityLines.map((line) => (
              <li key={line.id} className="admin-booking-line-item">
                <span className="min-w-0 truncate">{line.label}</span>
                <span className="admin-booking-line-price">
                  {line.amountCents > 0
                    ? formatPrice(line.amountCents)
                    : "Included"}
                </span>
              </li>
            ))}
            {details.extrasLines.map((line) => (
              <li key={line.id} className="admin-booking-line-item">
                <span className="min-w-0 truncate">{line.label}</span>
                <span className="admin-booking-line-price">
                  {formatPrice(line.totalCents)}
                </span>
              </li>
            ))}
          </ul>

          <div className="admin-booking-footer">
            <span className="admin-booking-meta-row">
              Submitted {details.submittedAt}
              {booking.status === "awaiting_payment"
                ? ` · Deposit ${formatPrice(details.depositCents)} · Balance ${formatPrice(details.balanceCents)} on arrival`
                : ""}
            </span>
            {["pending", "awaiting_payment", "confirmed"].includes(
              booking.status
            ) && (
              <button
                type="button"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  onAction(booking.id, "cancel");
                }}
                className="admin-booking-cancel"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function BookingsTable({
  bookings,
  acting,
  onAction,
  monthLabelText,
  monthMeta,
}: {
  bookings: BookingWithSlot[];
  acting: string | null;
  onAction: (id: string, action: string) => void;
  monthLabelText?: string;
  monthMeta?: string;
}) {
  return (
    <section className="admin-schedule-month admin-bookings-panel">
      {monthLabelText ? (
        <div className="admin-bookings-month-head">
          <p className="admin-bookings-month-title">{monthLabelText}</p>
          {monthMeta ? (
            <p className="admin-bookings-month-meta">{monthMeta}</p>
          ) : null}
        </div>
      ) : null}

      <div className="admin-bookings-table-wrap">
        <BookingsTableHeader />
        <div className="admin-bookings-body">
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              acting={acting}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function sortBookings(list: BookingWithSlot[]) {
  return [...list].sort((a, b) => {
    const dateDiff = compareByNearestDate(a, b);
    if (dateDiff !== 0) return dateDiff;
    return statusPriority(a.status) - statusPriority(b.status);
  });
}

export default function BookingsList({
  bookings,
  acting,
  onAction,
  groupByMonth = true,
}: BookingsListProps) {
  const groups = useMemo(() => {
    if (!groupByMonth) return null;

    const map = new Map<string, BookingWithSlot[]>();

    for (const booking of bookings) {
      const key = monthKey(bookingSortDate(booking));
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }

    return Array.from(map.entries())
      .sort(([, monthA], [, monthB]) =>
        compareByNearestDate(sortBookings(monthA)[0], sortBookings(monthB)[0])
      )
      .map(([key, monthBookings]) => {
        const sorted = sortBookings(monthBookings);
        const actionCount = monthBookings.filter(
          (booking) =>
            booking.status === "pending" ||
            booking.status === "awaiting_payment"
        ).length;

        return {
          key,
          label: monthLabel(bookingSortDate(sorted[0])),
          bookings: sorted,
          meta: `${sorted.length} booking${sorted.length === 1 ? "" : "s"}${
            actionCount > 0 ? ` · ${actionCount} need action` : ""
          }`,
        };
      });
  }, [bookings, groupByMonth]);

  const flatBookings = useMemo(
    () => (groupByMonth ? null : sortBookings(bookings)),
    [bookings, groupByMonth]
  );

  if (bookings.length === 0) {
    return (
      <AdminEmptyState
        icon={ClipboardList}
        title="No bookings match"
        description="Try a different filter or search term."
      />
    );
  }

  if (flatBookings) {
    return (
      <div className="admin-bookings-list">
        <BookingsTable
          bookings={flatBookings}
          acting={acting}
          onAction={onAction}
        />
      </div>
    );
  }

  return (
    <div className="admin-bookings-list">
      {groups?.map((group) => (
        <BookingsTable
          key={group.key}
          bookings={group.bookings}
          acting={acting}
          onAction={onAction}
          monthLabelText={group.label}
          monthMeta={group.meta}
        />
      ))}
    </div>
  );
}
