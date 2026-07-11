import { Calendar, Package, Users } from "lucide-react";
import {
  formatPrice,
  getServiceBySlug,
  getServicePriceCents,
  lineItemEstimatedTotal,
  isStayOnlyService,
  formatCourseLineSummary,
} from "@/lib/services-catalog";
import { formatBookingDates } from "@/lib/schedule-utils";
import {
  getSelectedExtrasDisplay,
  type BookingExtras,
} from "@/lib/booking-extras";
import type { CourseLineItem } from "@/components/booking/CourseLineCard";

type SummaryLine = {
  id: string;
  label: string;
  subtitle: string;
  unitLabel?: string;
  totalCents?: number;
};

type BookingSummaryPanelProps = {
  step: number;
  startDate: string;
  sessionDurationDays: 1 | 2;
  lineItems: CourseLineItem[];
  extras: BookingExtras;
  participantCount: number;
  estimatedTotal: number;
  bookingUnitsSummary: string;
};

function SummaryLineItem({ line }: { line: SummaryLine }) {
  return (
    <li className="booking-summary-line-item">
      <div className="min-w-0">
        <p className="booking-summary-line-label">{line.label}</p>
        <p className="booking-summary-line-subtitle">{line.subtitle}</p>
        {line.unitLabel && (
          <p className="booking-summary-line-unit">{line.unitLabel}</p>
        )}
      </div>
      {line.totalCents != null && line.totalCents > 0 && (
        <span className="booking-summary-line-price">
          {formatPrice(line.totalCents)}
        </span>
      )}
    </li>
  );
}

function SummarySection({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof Calendar;
  title: string;
  lines: SummaryLine[];
}) {
  if (lines.length === 0) return null;

  return (
    <section className="booking-summary-section">
      <div className="booking-summary-section-label">
        <Icon size={12} />
        <span>{title}</span>
      </div>
      <ul className="booking-summary-line-list">
        {lines.map((line) => (
          <SummaryLineItem key={line.id} line={line} />
        ))}
      </ul>
    </section>
  );
}

function courseUnitLabel(
  service: NonNullable<ReturnType<typeof getServiceBySlug>>,
  item: CourseLineItem,
): string | undefined {
  if (isStayOnlyService(service)) return undefined;

  const unitPrice = getServicePriceCents(service, item.durationDays);
  const durationTag = item.durationDays === 2 ? "2-day rate" : "1-day rate";

  if (service.pricingUnit === "session") {
    return `${formatPrice(unitPrice)} / person / session · ${durationTag}`;
  }

  return `${formatPrice(unitPrice)} / person · ${durationTag}`;
}

export default function BookingSummaryPanel({
  step,
  startDate,
  sessionDurationDays,
  lineItems,
  extras,
  participantCount,
  estimatedTotal,
  bookingUnitsSummary,
}: BookingSummaryPanelProps) {
  const dateLines: SummaryLine[] = startDate
    ? [
        {
          id: "session-date",
          label: formatBookingDates(startDate, sessionDurationDays),
          subtitle:
            sessionDurationDays === 1
              ? "1-day session"
              : "2 consecutive days with overnight stay",
        },
      ]
    : [];

  const courseLines: SummaryLine[] = lineItems
    .filter((item) => item.participants >= 1)
    .map((item) => {
      const service = getServiceBySlug(item.serviceSlug);
      if (!service) {
        return {
          id: item.id,
          label: item.serviceSlug,
          subtitle: `${item.participants} people`,
        };
      }

      return {
        id: item.id,
        label: service.title,
        subtitle: formatCourseLineSummary(
          service,
          item.sessions,
          item.participants,
          item.durationDays
        ),
        unitLabel: courseUnitLabel(service, item),
        totalCents: lineItemEstimatedTotal(
          service,
          item.sessions,
          item.participants,
          item.durationDays
        ),
      };
    });

  const extrasLines: SummaryLine[] = getSelectedExtrasDisplay(
    extras,
    sessionDurationDays,
    participantCount,
    lineItems
  ).map((line) => ({
    id: line.id,
    label: line.label,
    subtitle: line.subtitle,
    unitLabel: line.unitLabel || undefined,
  }));

  const hasContent =
    dateLines.length > 0 ||
    (step >= 2 && courseLines.length > 0) ||
    (step >= 3 && extrasLines.length > 0);

  return (
    <aside className="booking-summary booking-summary-sticky card-surface rounded-xl">
      <div className="booking-summary-header">
        <h2 className="booking-summary-title">Your booking</h2>
      </div>

      {hasContent ? (
        <>
          <div className="booking-summary-body">
            <SummarySection icon={Calendar} title="Date" lines={dateLines} />

            {step >= 2 && (
              <SummarySection icon={Users} title="Activities" lines={courseLines} />
            )}

            {step >= 3 && (
              <SummarySection icon={Package} title="Add-ons" lines={extrasLines} />
            )}
          </div>

          {step >= 2 && bookingUnitsSummary && (
            <footer className="booking-summary-footer">
              <span className="booking-summary-meta">{bookingUnitsSummary}</span>
              {estimatedTotal > 0 && (
                <span className="booking-summary-total">
                  {formatPrice(estimatedTotal)}
                </span>
              )}
            </footer>
          )}
        </>
      ) : (
        <p className="booking-summary-empty">
          Your summary fills in as you complete each step.
        </p>
      )}
    </aside>
  );
}
