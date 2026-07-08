type LineDurationSelectorProps = {
  value: 1 | 2;
  onChange: (days: 1 | 2) => void;
  tripDurationDays: 1 | 2;
  stayOnly?: boolean;
};

export default function LineDurationSelector({
  value,
  onChange,
  tripDurationDays,
  stayOnly = false,
}: LineDurationSelectorProps) {
  if (tripDurationDays === 1) {
    return (
      <p className="text-sm font-medium text-sand">
        1 day
        <span className="ml-1 text-xs font-normal text-sand-muted">
          (matches group trip)
        </span>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-lg border border-teal/20 bg-input p-0.5">
        <button
          type="button"
          onClick={() => onChange(1)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === 1
              ? "bg-teal text-[var(--btn-primary-fg)]"
              : "text-sand-muted hover:text-sand"
          }`}
        >
          1 day
        </button>
        <button
          type="button"
          onClick={() => onChange(2)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === 2
              ? "bg-teal text-[var(--btn-primary-fg)]"
              : "text-sand-muted hover:text-sand"
          }`}
        >
          2 days
        </button>
      </div>
      <p className="text-xs text-sand-muted">
        {stayOnly
          ? value === 1
            ? "Staying overnight for one night only."
            : "Staying both nights of the group trip."
          : value === 1
            ? "Activity on the first day only — others may stay 2 days."
            : "Activity on both days of the group trip."}
      </p>
    </div>
  );
}
