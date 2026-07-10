import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

const styles: Record<UserRole, string> = {
  admin:
    "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-200 dark:border-amber-500/25",
  coach: "bg-teal/15 text-teal border-teal/25",
  instructor:
    "bg-sky-500/15 text-sky-800 border-sky-500/30 dark:text-sky-200 dark:border-sky-500/25",
  staff:
    "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-300 dark:border-slate-500/25",
};

export default function RoleBadge({
  role,
  compact = false,
}: {
  role: UserRole;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border font-semibold ${
        compact
          ? "px-2 py-0.5 text-[0.6875rem] tracking-normal"
          : "px-2.5 py-0.5 text-xs uppercase tracking-wide"
      } ${styles[role]}`}
    >
      {roleLabel(role)}
    </span>
  );
}
