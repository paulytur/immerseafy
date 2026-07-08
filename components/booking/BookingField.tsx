import type { ReactNode } from "react";

type BookingFieldProps = {
  label: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function BookingField({
  label,
  action,
  children,
  className,
}: BookingFieldProps) {
  return (
    <div className={className ?? ""}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="booking-field-label">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}
