"use client";

import { Car, Check, Home, MapPin, Users, UtensilsCrossed } from "lucide-react";
import {
  dayTourFeeSubtitle,
  dayTourFeeTotalCents,
  dayTourParticipantCount,
  DAY_TOUR_FEE_LABEL,
  extraUnitPriceCents,
  mealsPackageDescription,
  BOOKING_EXTRA_PRICES,
  SHARED_AC_ROOM_LABEL,
  sharedAcRoomSubtitle,
  type BookingExtraKey,
  type BookingExtras,
  type BookingLineForExtras,
} from "@/lib/booking-extras";
import { formatPrice } from "@/lib/services-catalog";

type BookingExtrasSelectorProps = {
  sessionDurationDays: 1 | 2;
  participantCount: number;
  lineItems: BookingLineForExtras[];
  value: BookingExtras;
  onChange: (extras: BookingExtras) => void;
};

type ExtraOption = {
  key: BookingExtraKey;
  title: string;
  subtitle: string;
  icon: typeof UtensilsCrossed;
  hidden?: boolean;
};

export default function BookingExtrasSelector({
  sessionDurationDays,
  participantCount,
  lineItems,
  value,
  onChange,
}: BookingExtrasSelectorProps) {
  const count = Math.max(1, participantCount);
  const dayTourCount = dayTourParticipantCount(lineItems, sessionDurationDays);
  const showDayTourFee = dayTourCount > 0;

  const options: ExtraOption[] = [
    {
      key: "meals",
      title: "Meals",
      subtitle: mealsPackageDescription(sessionDurationDays),
      icon: UtensilsCrossed,
    },
    {
      key: "carpool",
      title: "Carpool",
      subtitle: "Shared ride — we’ll coordinate pickup details",
      icon: Car,
    },
    {
      key: "room",
      title: SHARED_AC_ROOM_LABEL,
      subtitle: sharedAcRoomSubtitle(sessionDurationDays),
      icon: Home,
      hidden: sessionDurationDays === 1,
    },
  ];

  function toggle(key: ExtraOption["key"]) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className="booking-extras">
      <div className="booking-extras-intro">
        <div className="booking-extras-intro-icon">
          <Users size={14} />
        </div>
        <p>
          Add-ons are priced <strong className="text-sand">per person</strong>
          {count > 1 ? (
            <>
              {" "}
              — your group has{" "}
              <strong className="text-teal">{count} people</strong> in total
            </>
          ) : (
            <> — rates below are for 1 person</>
          )}
        </p>
      </div>

      {showDayTourFee && (
        <div className="booking-extra-card booking-extra-card-locked" aria-label={DAY_TOUR_FEE_LABEL}>
          <div className="booking-extra-card-main">
            <div className="booking-extra-icon">
              <MapPin size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="booking-extra-title">{DAY_TOUR_FEE_LABEL}</p>
                <span className="booking-extra-check booking-extra-check-selected" aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
              </div>
              <p className="booking-extra-subtitle">
                {dayTourFeeSubtitle(sessionDurationDays, dayTourCount)}
              </p>
            </div>
          </div>

          <div className="booking-extra-card-footer">
            <span className="booking-extra-unit">
              {formatPrice(BOOKING_EXTRA_PRICES.dayTourFeeCents)}
              <span className="text-sand-muted"> / person</span>
            </span>
            <span className="booking-extra-total">
              {formatPrice(dayTourFeeTotalCents(dayTourCount))} total
              {dayTourCount > 1 ? ` · ${dayTourCount} people` : ""}
            </span>
          </div>
        </div>
      )}

      <div className="booking-extras-grid">
        {options
          .filter((option) => !option.hidden)
          .map((option) => {
            const Icon = option.icon;
            const selected = value[option.key];
            const unitPrice = extraUnitPriceCents(option.key);

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggle(option.key)}
                aria-pressed={selected}
                className={`booking-extra-card ${selected ? "booking-extra-card-selected" : ""}`}
              >
                <div className="booking-extra-card-main">
                  <div className="booking-extra-icon">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="booking-extra-title">{option.title}</p>
                      <span
                        className={`booking-extra-check ${selected ? "booking-extra-check-selected" : ""}`}
                        aria-hidden
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="booking-extra-subtitle">{option.subtitle}</p>
                  </div>
                </div>

                <div className="booking-extra-card-footer">
                  <span className="booking-extra-unit">
                    {formatPrice(unitPrice)}
                    <span className="text-sand-muted"> / person</span>
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
