import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

const styles: Record<UserRole, string> = {
  admin: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  coach: "bg-teal/15 text-teal border-teal/25",
  instructor: "bg-sky-500/15 text-sky-200 border-sky-500/25",
  staff: "bg-slate-500/15 text-slate-300 border-slate-500/25",
};

export default function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[role]}`}
    >
      {roleLabel(role)}
    </span>
  );
}
