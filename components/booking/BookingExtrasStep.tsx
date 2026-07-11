"use client";

import BookingExtrasSelector from "@/components/booking/BookingExtrasSelector";
import type { CourseLineItem } from "@/components/booking/CourseLineCard";
import type { BookingExtras } from "@/lib/booking-extras";

type BookingExtrasStepProps = {
  sessionDurationDays: 1 | 2;
  participantCount: number;
  lineItems: CourseLineItem[];
  value: BookingExtras;
  onChange: (extras: BookingExtras) => void;
};

export default function BookingExtrasStep({
  sessionDurationDays,
  participantCount,
  lineItems,
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
          {sessionDurationDays === 1 ? (
            <>
              1-day trips include a day tour fee (no overnight room). You can
              also add optional meals and carpool — all priced per participant.
            </>
          ) : (
            <>
              Choose optional add-ons for your group. Participants on{" "}
              <strong className="text-sand">1-day activities only</strong> are
              charged a day tour fee instead of overnight room.
            </>
          )}
        </p>
      </header>

      <BookingExtrasSelector
        sessionDurationDays={sessionDurationDays}
        participantCount={participantCount}
        lineItems={lineItems}
        value={value}
        onChange={onChange}
      />
    </section>
  );
}
