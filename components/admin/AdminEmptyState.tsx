import type { LucideIcon } from "lucide-react";

type AdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="admin-panel flex flex-col items-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-sand">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-sand-muted">{description}</p>
      )}
    </div>
  );
}
