"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Package,
  Send,
  Users,
} from "lucide-react";

const STEPS = [
  {
    icon: Calendar,
    title: "Choose your group trip",
    detail:
      "Pick how long your group is on site (1 or 2 days). On step 2, each person or activity can have its own length — e.g. one day of Practice Dive while others stay 2 days.",
  },
  {
    icon: Users,
    title: "Choose your activities",
    detail:
      "Add a line per activity type and set headcount. Use Accompanying guest for people staying without diving. Mix 1-day and 2-day activities when your trip is 2 days.",
  },
  {
    icon: Package,
    title: "Choose add-ons",
    detail:
      "Optional add-ons: meals, carpool, and shared AC room (2-day trips). All priced per person.",
  },
  {
    icon: Send,
    title: "Enter contact details",
    detail:
      "Add your name, email, and phone so we can confirm your booking and send payment instructions.",
  },
  {
    icon: ClipboardCheck,
    title: "Wait for our confirmation",
    detail:
      "Your status will show Request received. We check availability with the resort within 1–2 business days, then email QR Pay instructions for a 50% deposit if your slot is approved.",
  },
] as const;

type BookingHowToProps = {
  currentStep: number;
};

export default function BookingHowTo({ currentStep }: BookingHowToProps) {
  const [open, setOpen] = useState(false);

  if (currentStep > 4) return null;

  return (
    <section className="booking-how-to">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="booking-how-to-toggle"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <CircleHelp size={18} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-sand">How to book</p>
            <p className="text-xs text-sand-muted">
              {open
                ? "Hide guide"
                : "New here? See how the booking request works"}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-teal transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="booking-how-to-body">
          <p className="booking-how-to-intro">
            You&apos;re sending a <strong className="text-sand">booking request</strong>,
            not paying yet. We confirm your slot with the resort first — usually
            within 1–2 business days — then send deposit payment instructions if
            approved.
          </p>

          <ol className="booking-how-to-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title} className="booking-how-to-step">
                  <span className="booking-how-to-step-number">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-sand">
                      <Icon size={14} className="shrink-0 text-teal" />
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-sand-muted">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="booking-how-to-tip">
            <strong className="text-sand">Tip:</strong> After you submit, download
            your summary PDF and save your booking reference — you&apos;ll need
            them if you contact us about this request.
          </p>
        </div>
      )}
    </section>
  );
}
