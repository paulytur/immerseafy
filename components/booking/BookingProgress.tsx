import { Calendar, Check, Package, User, Users } from "lucide-react";

const STEPS = [
  { id: 1, label: "Date", icon: Calendar },
  { id: 2, label: "Activities", icon: Users },
  { id: 3, label: "Add-ons", icon: Package },
  { id: 4, label: "Contact", icon: User },
] as const;

export const BOOKING_STEP_COUNT = STEPS.length;

type BookingProgressProps = {
  currentStep: number;
};

export default function BookingProgress({ currentStep }: BookingProgressProps) {
  return (
    <nav aria-label="Booking progress" className="booking-progress">
      <ol className="booking-progress-list">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          const Icon = step.icon;

          return (
            <li key={step.id} className="booking-progress-item">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-teal bg-teal text-[var(--btn-primary-fg)]"
                      : active
                        ? "border-teal bg-teal/15 text-teal"
                        : "border-teal/25 bg-input text-sand-muted"
                  }`}
                >
                  {done ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`booking-progress-label ${
                    active || done ? "text-teal" : "text-sand-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`booking-progress-connector ${
                    done ? "bg-teal" : "bg-teal/20"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
