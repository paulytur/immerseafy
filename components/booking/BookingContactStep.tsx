"use client";

import { formatPrice } from "@/lib/services-catalog";
import { formatBookingDates } from "@/lib/schedule-utils";
import { philippinePhoneHint } from "@/lib/phone-validation";

type BookingContactStepProps = {
  startDate: string;
  sessionDurationDays: 1 | 2;
  bookingUnitsSummary: string;
  estimatedTotal: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  phoneError?: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
};

export default function BookingContactStep({
  startDate,
  sessionDurationDays,
  bookingUnitsSummary,
  estimatedTotal,
  customerName,
  customerEmail,
  customerPhone,
  phoneError,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
}: BookingContactStepProps) {
  return (
    <section className="booking-contact-step" aria-labelledby="booking-contact-heading">
      <header className="booking-details-section-head">
        <p className="booking-step-eyebrow">Step 4 of 4</p>
        <h2 id="booking-contact-heading" className="booking-details-section-title">
          Contact details
        </h2>
        <p className="booking-details-section-lead">
          Who should we reach about this booking? We&apos;ll email confirmation
          and payment instructions here.
        </p>
      </header>

      <div className="booking-contact-fields space-y-3">
        <div>
          <label htmlFor="contact-name" className="form-label">
            Your name
          </label>
          <input
            id="contact-name"
            required
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Person making the booking"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="form-label">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="form-label">
            Phone (Philippines)
          </label>
          <input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            placeholder={philippinePhoneHint()}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? "contact-phone-error" : "contact-phone-hint"}
            className={`form-input${phoneError ? " form-input-invalid" : ""}`}
          />
          {phoneError ? (
            <p id="contact-phone-error" className="form-field-error">
              {phoneError}
            </p>
          ) : (
            <p id="contact-phone-hint" className="form-field-hint">
              Mobile numbers only — {philippinePhoneHint()}
            </p>
          )}
        </div>
      </div>

      {startDate && (
        <div className="booking-details-review">
          <p className="booking-details-review-label">Ready to submit</p>
          <p className="booking-details-review-body">
            <strong className="text-teal">Dates:</strong>{" "}
            {formatBookingDates(startDate, sessionDurationDays)}
            {" · "}
            <strong className="text-teal">{bookingUnitsSummary}</strong>
            {estimatedTotal > 0 && (
              <>
                {" · "}
                <strong className="text-teal">{formatPrice(estimatedTotal)}</strong>
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
