import type { BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS } from "@/lib/references";

const styles: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  awaiting_payment: "bg-sky-500/15 text-sky-200 border-sky-500/25",
  confirmed: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  expired: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  cancelled: "bg-red-500/15 text-red-200 border-red-500/25",
};

export default function StatusBadge({
  status,
  compact = false,
}: {
  status: BookingStatus;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${styles[status]} ${
        compact ? "px-1.5 py-0 text-[0.625rem]" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
