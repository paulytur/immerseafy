import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type AdminStatCardProps = {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  accent?: "teal" | "amber" | "emerald";
};

const accents = {
  teal: "bg-teal/15 text-teal",
  amber: "bg-amber-500/15 text-amber-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
};

export default function AdminStatCard({
  label,
  value,
  href,
  icon: Icon,
  accent = "teal",
}: AdminStatCardProps) {
  return (
    <Link href={href} className="admin-stat-card group block">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-sand-muted opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
      <p className="mt-4 text-sm text-sand-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold text-sand">{value}</p>
    </Link>
  );
}
