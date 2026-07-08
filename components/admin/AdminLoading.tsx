export default function AdminLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sand-muted">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function AdminLoadingCard() {
  return (
    <div className="admin-panel animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-teal/10" />
      <div className="h-3 w-2/3 rounded bg-teal/10" />
      <div className="h-3 w-1/2 rounded bg-teal/10" />
    </div>
  );
}
