"use client";

import BookingExtrasSelector from "@/components/booking/BookingExtrasSelector";
import type { BookingExtras } from "@/lib/booking-extras";

type BookingExtrasStepProps = {
  sessionDurationDays: 1 | 2;
  participantCount: number;
  value: BookingExtras;
  onChange: (extras: BookingExtras) => void;
};

export default function BookingExtrasStep({
  sessionDurationDays,
  participantCount,
  value,
  onChange,
}: BookingExtrasStepProps) {
  return (
    <section className="booking-extras-step" aria-labelledby="booking-extras-heading">
      <header className="booking-details-section-head">
        <p className="booking-step-eyebrow">Step 3 of 4</p>
        <h2 id="booking-extras-heading" className="booking-details-section-title">
          Meals, travel &amp; stay
        </h2>
        <p className="booking-details-section-lead">
          Choose optional add-ons for your group. Everything here is arranged
          with the resort and priced per participant.
        </p>
      </header>

      <BookingExtrasSelector
        sessionDurationDays={sessionDurationDays}
        participantCount={participantCount}
        value={value}
        onChange={onChange}
      />
    </section>
  );
}
