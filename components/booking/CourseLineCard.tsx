"use client";

import { useState } from "react";
import { ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import BookingField from "@/components/booking/BookingField";
import LineDurationSelector from "@/components/booking/LineDurationSelector";
import ServicePicker from "@/components/booking/ServicePicker";
import {
  formatCourseLineSummary,
  formatPrice,
  getServiceBySlug,
  getServicePriceCents,
  maxSessionsForService,
  clampSessionCount,
  servicePricingUnit,
  isStayOnlyService,
} from "@/lib/services-catalog";
import { getServiceIcon } from "@/components/booking/service-icon";

export type CourseLineItem = {
  id: string;
  serviceSlug: string;
  sessions: number;
  participants: number;
  durationDays: 1 | 2;
};

type CourseLineCardProps = {
  item: CourseLineItem;
  canRemove: boolean;
  tripDurationDays: 1 | 2;
  usedServiceSlugs: string[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onUpdate: (id: string, patch: Partial<CourseLineItem>) => void;
  onRemove: (id: string) => void;
};

export default function CourseLineCard({
  item,
  canRemove,
  tripDurationDays,
  usedServiceSlugs,
  expanded,
  defaultExpanded = true,
  onExpandedChange,
  onUpdate,
  onRemove,
}: CourseLineCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;

  const service = getServiceBySlug(item.serviceSlug);
  const stayOnly = isStayOnlyService(service);
  const Icon = getServiceIcon(item.serviceSlug);
  const unitPrice = service && !stayOnly ? getServicePriceCents(service, item.durationDays) : 0;
  const pricingUnit = service ? servicePricingUnit(service) : "person";
  const sessionMax = service ? maxSessionsForService(service) : null;
  const lineTotal =
    stayOnly || !service
      ? 0
      : pricingUnit === "session"
        ? unitPrice * item.sessions * item.participants
        : unitPrice * item.participants;

  const quantitySummary =
    service &&
    formatCourseLineSummary(service, item.sessions, item.participants, item.durationDays);

  function setExpanded(next: boolean) {
    if (expanded === undefined) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  }

  function toggleExpanded() {
    setExpanded(!isExpanded);
  }

  function changeSessions(delta: number) {
    if (!service || stayOnly) return;
    onUpdate(item.id, {
      sessions: clampSessionCount(service, item.sessions + delta),
    });
  }

  function changeParticipants(delta: number) {
    onUpdate(item.id, { participants: Math.max(1, item.participants + delta) });
  }

  function renderCounter(
    value: number,
    onDecrease: () => void,
    onIncrease: () => void,
    decreaseLabel: string,
    increaseLabel: string,
    max?: number | null
  ) {
    const atMax = max != null && value >= max;

    return (
      <div className="inline-flex items-center rounded-lg border border-teal/20 bg-input p-0.5">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= 1}
          className="rounded-md p-2 text-teal transition-colors hover:bg-teal/10 disabled:opacity-40"
          aria-label={decreaseLabel}
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[2.5rem] text-center text-sm font-semibold text-sand">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={atMax}
          className="rounded-md p-2 text-teal transition-colors hover:bg-teal/10 disabled:opacity-40"
          aria-label={increaseLabel}
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <article className="booking-activity-card">
      <div
        className={`booking-activity-header${isExpanded ? " booking-activity-header-open" : ""}`}
      >
        <button
          type="button"
          onClick={toggleExpanded}
          className="booking-activity-toggle"
          aria-expanded={isExpanded}
          aria-label={
            service
              ? `${isExpanded ? "Collapse" : "Expand"} ${service.title}`
              : "Expand activity"
          }
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal/15 text-teal">
              <Icon size={14} />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-sand">
                {service?.title ?? "Select activity"}
              </p>
              {!isExpanded && quantitySummary && (
                <p className="truncate text-xs text-sand-muted">{quantitySummary}</p>
              )}
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-teal transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        <div className="booking-activity-actions">
          {lineTotal > 0 && (
            <span className="booking-pill text-[0.6875rem]">
              {formatPrice(lineTotal)}
            </span>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-md p-1 text-sand-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Remove activity"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="booking-activity-body space-y-2.5">
          <BookingField label="Change activity">
            <ServicePicker
              value={item.serviceSlug}
              onChange={(slug) =>
                onUpdate(item.id, {
                  serviceSlug: slug,
                  sessions: 1,
                  durationDays: Math.min(item.durationDays, tripDurationDays) as 1 | 2,
                })
              }
              excludedSlugs={usedServiceSlugs.filter((slug) => slug !== item.serviceSlug)}
            />
          </BookingField>

          <BookingField label={stayOnly ? "Stay length" : "Activity length"}>
            <LineDurationSelector
              value={item.durationDays}
              onChange={(days) => onUpdate(item.id, { durationDays: days })}
              tripDurationDays={tripDurationDays}
              stayOnly={stayOnly}
            />
          </BookingField>

          {stayOnly ? (
            <BookingField label="How many accompanying guests?">
              {renderCounter(
                item.participants,
                () => changeParticipants(-1),
                () => changeParticipants(1),
                "Decrease guests",
                "Increase guests"
              )}
              <p className="mt-2 text-xs text-sand-muted">
                No activity fee — room and meals are added in the next step.
              </p>
            </BookingField>
          ) : pricingUnit === "session" ? (
            <>
              <BookingField label="How many sessions?">
                {sessionMax != null && (
                  <p className="mb-2 text-xs text-sand-muted">
                    Up to {sessionMax} sessions per booking
                  </p>
                )}
                {renderCounter(
                  item.sessions,
                  () => changeSessions(-1),
                  () => changeSessions(1),
                  "Decrease sessions",
                  "Increase sessions",
                  sessionMax
                )}
              </BookingField>

              <BookingField label="How many people?">
                {renderCounter(
                  item.participants,
                  () => changeParticipants(-1),
                  () => changeParticipants(1),
                  "Decrease people",
                  "Increase people"
                )}
              </BookingField>

              {lineTotal > 0 &&
                (item.sessions > 1 || item.participants > 1) && (
                <p className="text-xs text-sand-muted">
                  {formatPrice(unitPrice)} × {item.sessions}{" "}
                  {item.sessions === 1 ? "session" : "sessions"} × {item.participants}{" "}
                  {item.participants === 1 ? "person" : "people"} ={" "}
                  <strong className="text-teal">{formatPrice(lineTotal)}</strong>
                </p>
              )}
            </>
          ) : (
            <BookingField label="How many people?">
              {renderCounter(
                item.participants,
                () => changeParticipants(-1),
                () => changeParticipants(1),
                "Decrease people",
                "Increase people"
              )}
              {lineTotal > 0 && item.participants > 1 && (
                <p className="mt-2 text-xs text-sand-muted">
                  {formatPrice(unitPrice)} × {item.participants} people ={" "}
                  <strong className="text-teal">{formatPrice(lineTotal)}</strong>
                </p>
              )}
            </BookingField>
          )}
        </div>
      )}
    </article>
  );
}
