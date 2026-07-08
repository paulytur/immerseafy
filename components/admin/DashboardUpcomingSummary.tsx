import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Users } from "lucide-react";
import { formatBookingDates } from "@/lib/schedule-utils";
import type { Coach } from "@/lib/coaches";
import type { BookingStatus } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";

export type DashboardUpcomingBooking = {
  id: string;
  reference: string;
  customerName: string;
  status: BookingStatus;
  headcount: number;
  summary: string;
};

type DashboardUpcomingSummaryProps = {
  nearestDate: string | null;
  coaches: Coach[];
  bookings: DashboardUpcomingBooking[];
};

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardUpcomingSummary({
  nearestDate,
  coaches,
  bookings,
}: DashboardUpcomingSummaryProps) {
  if (!nearestDate) {
    return (
      <section className="admin-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              Next session
            </h2>
            <p className="text-sm text-sand-muted">
              No upcoming schedule or bookings yet.
            </p>
          </div>
        </div>
        <Link
          href="/admin/schedule"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
        >
          Add coach availability
          <ArrowRight size={14} />
        </Link>
      </section>
    );
  }

  const dateLabel = formatBookingDates(nearestDate, 2);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-sand">
            Next session
          </h2>
          <p className="text-sm text-sand-muted">{dateLabel}</p>
        </div>
        <span className="booking-pill">{dateLabel}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-teal" />
              <h3 className="font-medium text-sand">Coaches available</h3>
            </div>
            <Link
              href="/admin/schedule"
              className="text-xs font-medium text-teal hover:underline"
            >
              Schedule →
            </Link>
          </div>

          {coaches.length === 0 ? (
            <p className="mt-4 text-sm text-sand-muted">
              No coaches marked for this date yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {coaches.map((coach) => (
                <span key={coach.id} className="admin-coach-chip" title={coach.name}>
                  <span className="admin-coach-chip-initials">
                    {coachInitials(coach.name)}
                  </span>
                  <span className="admin-coach-chip-name">{coach.name}</span>
                </span>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-sand-muted">
            {coaches.length} coach{coaches.length === 1 ? "" : "es"} on both
            days
          </p>
        </div>

        <div className="admin-panel">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-teal" />
              <h3 className="font-medium text-sand">Bookings</h3>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-teal hover:underline"
            >
              All bookings →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-sand-muted">
              No active bookings on this date.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-teal/10 bg-ocean-mid/20 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sand">
                        {booking.customerName}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-sand-muted">
                      {booking.summary}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.65rem] text-teal/80">
                      {booking.reference}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-sand-muted">
                    {booking.headcount}{" "}
                    {booking.headcount === 1 ? "pax" : "pax"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-sand-muted">
            {bookings.length} active booking
            {bookings.length === 1 ? "" : "s"} on this date
          </p>
        </div>
      </div>
    </section>
  );
}
