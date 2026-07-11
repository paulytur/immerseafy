import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { formatPrice } from "@/lib/services-catalog";
import type { DashboardTrip } from "@/lib/dashboard";

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TABLE_COLUMNS = [
  { key: "date", label: "Date", className: "col-date" },
  { key: "pax", label: "Guests", className: "col-pax" },
  { key: "pending", label: "Pending", className: "col-pending" },
  { key: "awaiting", label: "Awaiting", className: "col-awaiting" },
  { key: "confirmed", label: "Confirmed", className: "col-confirmed" },
  { key: "deposits", label: "Deposits", className: "col-deposits" },
  { key: "coaches", label: "Coaches", className: "col-coaches" },
  { key: "actions", label: "", className: "col-actions" },
] as const;

function TripsTableHeader() {
  return (
    <div className="admin-dashboard-trips-head" role="row">
      {TABLE_COLUMNS.map((column) => (
        <span
          key={column.key}
          className={`admin-dashboard-trips-head-cell ${column.className}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

function TripRow({ trip, featured = false }: { trip: DashboardTrip; featured?: boolean }) {
  return (
    <article
      className={`admin-dashboard-trips-row${featured ? " admin-dashboard-trips-row-next" : ""}`}
    >
      <div className="admin-dashboard-trips-row-grid" role="row">
        <div className="admin-dashboard-trips-cell col-date">
          <span className="admin-booking-highlight">{trip.dateLabel}</span>
          {featured ? (
            <span className="admin-dashboard-trip-next-pill mt-1">Next up</span>
          ) : null}
        </div>

        <div className="admin-dashboard-trips-cell col-pax">
          <span className="admin-booking-highlight-pill">
            {trip.totalPax} guest{trip.totalPax === 1 ? "" : "s"}
          </span>
        </div>

        <div className="admin-dashboard-trips-cell col-pending">
          {trip.pendingCount > 0 ? trip.pendingCount : "—"}
        </div>

        <div className="admin-dashboard-trips-cell col-awaiting">
          {trip.awaitingCount > 0 ? trip.awaitingCount : "—"}
        </div>

        <div className="admin-dashboard-trips-cell col-confirmed">
          {trip.confirmedCount > 0 ? trip.confirmedCount : "—"}
        </div>

        <div className="admin-dashboard-trips-cell col-deposits">
          {trip.confirmedRevenueCents > 0
            ? formatPrice(trip.confirmedRevenueCents)
            : "—"}
        </div>

        <div className="admin-dashboard-trips-cell col-coaches">
          {trip.coaches.length === 0 ? (
            <Link
              href="/admin/schedule"
              className="admin-dashboard-trip-warning text-xs hover:underline"
            >
              None
            </Link>
          ) : (
            <div className="admin-schedule-table-coaches">
              {trip.coaches.slice(0, 4).map((coach) => (
                <span key={coach.id} className="admin-coach-chip" title={coach.name}>
                  <span className="admin-coach-chip-initials">
                    {coachInitials(coach.name)}
                  </span>
                  <span className="admin-coach-chip-name">
                    {coach.name.split(" ")[0]}
                  </span>
                </span>
              ))}
              {trip.coaches.length > 4 ? (
                <span className="text-xs text-sand-muted">
                  +{trip.coaches.length - 4}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="admin-dashboard-trips-cell col-actions">
          <Link
            href="/admin/bookings"
            className="admin-booking-btn admin-booking-btn-primary"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function DashboardUpcomingTrips({
  trips,
}: {
  trips: DashboardTrip[];
}) {
  if (trips.length === 0) {
    return (
      <section className="admin-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              Upcoming trips
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-sand">
            Upcoming trips
          </h2>
          <p className="text-sm text-sand-muted">
            Schedule blocks with booking activity.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="text-sm font-medium text-teal hover:underline"
        >
          View bookings →
        </Link>
      </div>

      <section className="admin-bookings-panel">
        <div className="admin-dashboard-trips-table-wrap">
          <TripsTableHeader />
          <div className="admin-dashboard-trips-body">
            {trips.map((trip, index) => (
              <TripRow key={trip.startDate} trip={trip} featured={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
