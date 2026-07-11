import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { DashboardAlert } from "@/lib/dashboard";

const toneStyles = {
  amber: "admin-attention-row-amber",
  rose: "admin-attention-row-rose",
  teal: "admin-attention-row-teal",
};

export default function DashboardAttention({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <section className="admin-panel admin-dashboard-attention admin-dashboard-attention-clear">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              All caught up
            </h2>
            <p className="text-sm text-sand-muted">
              No urgent items right now. Upcoming trips are below.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-300" />
        <h2 className="font-display text-lg font-semibold text-sand">
          Needs attention
        </h2>
      </div>

      <section className="admin-bookings-panel">
        <div className="admin-attention-table-wrap">
          <div className="admin-attention-head" role="row">
            <span className="admin-attention-head-cell col-issue">Issue</span>
            <span className="admin-attention-head-cell col-detail">Details</span>
            <span className="admin-attention-head-cell col-actions">Action</span>
          </div>

          <div className="admin-attention-body">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={`admin-attention-row ${toneStyles[alert.tone]}`}
              >
                <div className="admin-attention-row-grid" role="row">
                  <div className="admin-attention-cell col-issue">
                    <p className="font-medium text-sand">{alert.title}</p>
                  </div>
                  <div className="admin-attention-cell col-detail">
                    <p className="text-sm text-sand-muted">{alert.description}</p>
                  </div>
                  <div className="admin-attention-cell col-actions">
                    <span className="admin-booking-btn admin-booking-btn-primary">
                      Open
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
