type DurationSelectorProps = {
  value: 1 | 2;
  onChange: (days: 1 | 2) => void;
};

export default function DurationSelector({
  value,
  onChange,
}: DurationSelectorProps) {
  return (
    <div className="booking-duration-selector flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal/15 bg-ocean-mid/20 px-3 py-2 md:min-w-[15rem]">
      <div>
        <p className="text-xs font-medium text-sand">Group trip length</p>
        <p className="text-[0.6875rem] text-sand-muted">
          {value === 2
            ? "Two consecutive days — overnight stay available"
            : "Single day — no overnight stay"}
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-teal/20 bg-input p-0.5">
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
      </div>
    </div>
  );
}
