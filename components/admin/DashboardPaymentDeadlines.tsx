import Link from "next/link";
import { Clock3 } from "lucide-react";
import { formatPrice } from "@/lib/services-catalog";
import type { DashboardPaymentDeadline } from "@/lib/dashboard";

const TABLE_COLUMNS = [
  { key: "guest", label: "Guest", className: "col-guest" },
  { key: "reference", label: "Reference", className: "col-ref" },
  { key: "trip", label: "Trip", className: "col-trip" },
  { key: "deposit", label: "Deposit", className: "col-deposit" },
  { key: "expires", label: "Expires", className: "col-expires" },
  { key: "left", label: "Left", className: "col-left" },
] as const;

function DeadlinesTableHeader() {
  return (
    <div className="admin-deadlines-head" role="row">
      {TABLE_COLUMNS.map((column) => (
        <span
          key={column.key}
          className={`admin-deadlines-head-cell ${column.className}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

export default function DashboardPaymentDeadlines({
  deadlines,
}: {
  deadlines: DashboardPaymentDeadline[];
}) {
  if (deadlines.length === 0) return null;

  return (
    <section className="admin-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-amber-600 dark:text-amber-300" />
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              Payment deadlines
            </h2>
            <p className="text-sm text-sand-muted">
              Awaiting deposits, sorted by soonest expiry.
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

      <div className="admin-deadlines-table-wrap">
        <DeadlinesTableHeader />
        <div className="admin-deadlines-body">
          {deadlines.map((deadline) => (
            <article key={deadline.id} className="admin-deadlines-row">
              <div className="admin-deadlines-row-grid" role="row">
                <div className="admin-deadlines-cell col-guest">
                  <span className="font-medium text-sand">
                    {deadline.customerName}
                  </span>
                </div>

                <div className="admin-deadlines-cell col-ref">
                  <span className="font-mono text-[0.6875rem] text-teal/80">
                    {deadline.reference}
                  </span>
                </div>

                <div className="admin-deadlines-cell col-trip">
                  {deadline.dateLabel}
                </div>

                <div className="admin-deadlines-cell col-deposit">
                  <span className="font-semibold text-teal">
                    {formatPrice(deadline.depositCents)}
                  </span>
                </div>

                <div className="admin-deadlines-cell col-expires">
                  {deadline.expiresAt}
                </div>

                <div className="admin-deadlines-cell col-left">
                  <span
                    className={`admin-dashboard-deadline-hours${
                      deadline.hoursLeft <= 24
                        ? " admin-dashboard-deadline-hours-urgent"
                        : ""
                    }`}
                  >
                    {deadline.hoursLeft}h
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
