import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { DashboardAlert } from "@/lib/dashboard";

const toneStyles = {
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-100",
  teal: "border-teal/25 bg-teal/10 text-sand",
};

export default function DashboardAttention({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <section className="admin-panel admin-dashboard-attention admin-dashboard-attention-clear">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
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
        <AlertTriangle size={18} className="text-amber-300" />
        <h2 className="font-display text-lg font-semibold text-sand">
          Needs attention
        </h2>
      </div>

      <div className="admin-dashboard-alert-grid">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className={`admin-dashboard-alert ${toneStyles[alert.tone]}`}
          >
            <div className="min-w-0">
              <p className="font-medium">{alert.title}</p>
              <p className="mt-1 text-sm opacity-80">{alert.description}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 opacity-70" />
          </Link>
        ))}
      </div>
    </section>
  );
}
