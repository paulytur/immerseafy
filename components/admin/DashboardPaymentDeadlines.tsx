import Link from "next/link";
import { Clock3 } from "lucide-react";
import { formatPrice } from "@/lib/services-catalog";
import type { DashboardPaymentDeadline } from "@/lib/dashboard";

export default function DashboardPaymentDeadlines({
  deadlines,
}: {
  deadlines: DashboardPaymentDeadline[];
}) {
  if (deadlines.length === 0) return null;

  return (
    <section className="admin-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-amber-600 dark:text-amber-300" />
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              Payment deadlines
            </h2>
            <p className="text-sm text-sand-muted">
              Awaiting bookings, sorted by soonest expiry.
            </p>
          </div>
        </div>
        <Link
          href="/admin/bookings?status=awaiting_payment"
          className="text-sm font-medium text-teal hover:underline"
        >
          View all →
        </Link>
      </div>

      <ul className="admin-dashboard-deadlines">
        {deadlines.map((deadline) => (
          <li key={deadline.id} className="admin-dashboard-deadline">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sand">{deadline.customerName}</p>
                <span className="font-mono text-[0.65rem] text-teal/80">
                  {deadline.reference}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-sand-muted">
                Trip {deadline.dateLabel} · {formatPrice(deadline.totalCents)}
              </p>
              <p className="mt-0.5 text-xs text-sand-muted">
                Expires {deadline.expiresAt}
              </p>
            </div>
            <span
              className={`admin-dashboard-deadline-hours${deadline.hoursLeft <= 24 ? " admin-dashboard-deadline-hours-urgent" : ""}`}
            >
              {deadline.hoursLeft}h left
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
