import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles, Users } from "lucide-react";
import { formatPrice } from "@/lib/services-catalog";
import type { DashboardTrip } from "@/lib/dashboard";
import StatusBadge from "@/components/admin/StatusBadge";

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TripCard({
  trip,
  featured = false,
}: {
  trip: DashboardTrip;
  featured?: boolean;
}) {
  return (
    <article
      className={`admin-dashboard-trip-card${featured ? " admin-dashboard-trip-card-next" : ""}`}
    >
      <div className="admin-dashboard-trip-head">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold text-sand">
              {trip.dateLabel}
            </p>
            {featured ? (
              <span className="admin-dashboard-trip-next-pill">
                <Sparkles size={12} />
                Next up
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-sand-muted">
            {trip.totalPax > 0
              ? `${trip.bookings.length} booking${trip.bookings.length === 1 ? "" : "s"} on this date`
              : "No bookings yet"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {trip.totalPax > 0 ? (
            <span className="admin-dashboard-pax-highlight">
              {trip.totalPax} participant{trip.totalPax === 1 ? "" : "s"}
            </span>
          ) : null}
          {trip.needsCoaches ? (
            <span className="admin-dashboard-trip-warning">No coaches</span>
          ) : null}
        </div>
      </div>

      <div className="admin-dashboard-trip-stats">
        {trip.pendingCount > 0 ? (
          <span className="admin-dashboard-trip-stat">
            {trip.pendingCount} pending
          </span>
        ) : null}
        {trip.awaitingCount > 0 ? (
          <span className="admin-dashboard-trip-stat">
            {trip.awaitingCount} awaiting
          </span>
        ) : null}
        {trip.confirmedCount > 0 ? (
          <span className="admin-dashboard-trip-stat admin-dashboard-trip-stat-confirmed">
            {trip.confirmedCount} confirmed
          </span>
        ) : null}
        {trip.confirmedRevenueCents > 0 ? (
          <span className="admin-dashboard-trip-stat">
            {formatPrice(trip.confirmedRevenueCents)} confirmed
          </span>
        ) : null}
      </div>

      <div className="admin-dashboard-trip-coaches">
        <div className="flex items-center gap-1.5 text-xs text-sand-muted">
          <Users size={13} className="text-teal" />
          Coaches
        </div>
        {trip.coaches.length === 0 ? (
          <p className="text-xs text-sand-muted">None marked yet</p>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {trip.coaches.slice(0, featured ? 6 : 4).map((coach) => (
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
              </span>
            ))}
            {trip.coaches.length > (featured ? 6 : 4) ? (
              <span className="text-xs text-sand-muted">
                +{trip.coaches.length - (featured ? 6 : 4)} more
              </span>
            ) : null}
          </div>
        )}
      </div>

      {trip.bookings.length > 0 ? (
        <ul className="admin-dashboard-trip-bookings">
          {trip.bookings.slice(0, featured ? 5 : 3).map((booking) => (
            <li key={booking.id} className="admin-dashboard-trip-booking">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-sand">
                    {booking.customerName}
                  </p>
                  <StatusBadge status={booking.status} compact />
                </div>
                <p className="mt-0.5 truncate text-xs text-sand-muted">
                  {booking.summary}
                </p>
                {booking.participants.length > 0 ? (
                  <p className="admin-dashboard-participants">
                    {booking.participants.join(" · ")}
                  </p>
                ) : (
                  <p className="admin-dashboard-participants admin-dashboard-participants-fallback">
                    {booking.headcount} participant
                    {booking.headcount === 1 ? "" : "s"}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-[0.65rem] text-teal/70">
                  {booking.reference}
                </p>
              </div>
              <span className="admin-dashboard-booking-pax">
                {booking.headcount} pax
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {trip.bookings.length > (featured ? 5 : 3) ? (
        <p className="text-xs text-sand-muted">
          +{trip.bookings.length - (featured ? 5 : 3)} more booking
          {trip.bookings.length - (featured ? 5 : 3) === 1 ? "" : "s"}
        </p>
      ) : null}
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

  const [nextTrip, ...moreTrips] = trips;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-sand">
            Upcoming trips
          </h2>
          <p className="text-sm text-sand-muted">
            Next dates with schedule, bookings, or both.
          </p>
        </div>
        <Link
          href="/admin/schedule"
          className="text-sm font-medium text-teal hover:underline"
        >
          Manage schedule →
        </Link>
      </div>

      {nextTrip ? <TripCard trip={nextTrip} featured /> : null}

      {moreTrips.length > 0 ? (
        <div className="admin-dashboard-trip-grid">
          {moreTrips.map((trip) => (
            <TripCard key={trip.startDate} trip={trip} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
