"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, CalendarOff, Loader2, Plus } from "lucide-react";
import {
  BOOKING_SERVICES,
  getServiceBySlug,
  lineItemEstimatedTotal,
  summarizeBookingUnits,
  servicePricingUnit,
  clampSessionCount,
  validateSessionCount,
  isStayOnlyService,
} from "@/lib/services-catalog";
import { formatBookingDates } from "@/lib/schedule-utils";
import BookingHowTo from "@/components/booking/BookingHowTo";
import BookingProgress, { BOOKING_STEP_COUNT } from "@/components/booking/BookingProgress";
import DurationSelector from "@/components/booking/DurationSelector";
import DatePickerGrid from "@/components/booking/DatePickerGrid";
import CourseLineCard, {
  type CourseLineItem,
} from "@/components/booking/CourseLineCard";
import BookingExtrasStep from "@/components/booking/BookingExtrasStep";
import BookingContactStep from "@/components/booking/BookingContactStep";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import {
  normalizeBookingExtras,
  validateBookingExtras,
  bookingExtrasTotalCents,
  bookingGroupHeadcount,
  type BookingExtras,
} from "@/lib/booking-extras";
import {
  formatPhilippinePhoneE164,
  validatePhilippineMobilePhone,
} from "@/lib/phone-validation";

function firstAvailableServiceSlug(usedSlugs: string[]): string | null {
  return BOOKING_SERVICES.find((service) => !usedSlugs.includes(service.slug))?.slug ?? null;
}

function newLineItem(
  serviceSlug?: string,
  usedSlugs: string[] = [],
  tripDurationDays: 1 | 2 = 2
): CourseLineItem | null {
  const preferred =
    serviceSlug &&
    getServiceBySlug(serviceSlug) &&
    !usedSlugs.includes(serviceSlug)
      ? serviceSlug
      : firstAvailableServiceSlug(usedSlugs);

  if (!preferred) return null;

  return {
    id: crypto.randomUUID(),
    serviceSlug: preferred,
    sessions: 1,
    participants: 1,
    durationDays: tripDurationDays,
  };
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") ?? "";

  const [step, setStep] = useState(1);
  const [sessionDurationDays, setSessionDurationDays] = useState<1 | 2>(2);
  const [coachDates, setCoachDates] = useState<string[]>([]);
  const [twoDayStartDates, setTwoDayStartDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [lineItems, setLineItems] = useState<CourseLineItem[]>(() => {
    const initial = newLineItem(preselectedService || undefined, [], 2);
    return initial ? [initial] : [];
  });
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const initializedExpanded = useRef(false);

  useEffect(() => {
    if (!initializedExpanded.current && lineItems[0]) {
      initializedExpanded.current = true;
      setExpandedActivityId(lineItems[0].id);
    }
  }, [lineItems]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [extras, setExtras] = useState<BookingExtras>(() =>
    normalizeBookingExtras({}, 2)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");

    fetch("/api/sessions", { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load schedule");
        return {
          dates: (data.dates ?? []) as string[],
          twoDayStartDates: (data.twoDayStartDates ?? []) as string[],
        };
      })
      .then(({ dates, twoDayStartDates: twoDayStarts }) => {
        setCoachDates(dates);
        setTwoDayStartDates(twoDayStarts);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setLoadError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const sessionDates = useMemo(() => {
    if (sessionDurationDays === 1) return coachDates;
    return twoDayStartDates;
  }, [coachDates, twoDayStartDates, sessionDurationDays]);

  const availableDates = useMemo(() => {
    if (step === 1) return sessionDates;
    return sessionDates;
  }, [sessionDates, step]);

  function handleSessionDurationChange(days: 1 | 2) {
    setSessionDurationDays(days);
    setStartDate("");
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        durationDays: days === 1 ? 1 : item.durationDays,
      }))
    );
    setExtras((prev) => normalizeBookingExtras(prev, days));
  }

  useEffect(() => {
    if (startDate && !availableDates.includes(startDate)) {
      setStartDate("");
    }
  }, [availableDates, startDate]);

  const bookingUnitsSummary = useMemo(
    () => summarizeBookingUnits(lineItems),
    [lineItems]
  );

  const participantCount = useMemo(
    () => bookingGroupHeadcount(lineItems),
    [lineItems]
  );

  const estimatedTotal = useMemo(() => {
    const coursesTotal = lineItems.reduce((sum, item) => {
      const service = getServiceBySlug(item.serviceSlug);
      if (!service || item.participants < 1) return sum;
      if (!isStayOnlyService(service) && item.sessions < 1) return sum;
      return (
        sum +
        lineItemEstimatedTotal(
          service,
          item.sessions,
          item.participants,
          item.durationDays
        )
      );
    }, 0);

    return coursesTotal + bookingExtrasTotalCents(extras, sessionDurationDays, participantCount, lineItems);
  }, [lineItems, sessionDurationDays, extras, participantCount]);

  const canAddCourse = lineItems.length < BOOKING_SERVICES.length;

  function addLineItem() {
    if (!canAddCourse) return;

    const usedSlugs = lineItems.map((item) => item.serviceSlug);
    const nextItem = newLineItem(undefined, usedSlugs, sessionDurationDays);
    if (!nextItem) return;

    setLineItems((prev) => [...prev, nextItem]);
    setExpandedActivityId(nextItem.id);
  }

  function updateLineItem(id: string, patch: Partial<CourseLineItem>) {
    if (patch.serviceSlug) {
      const alreadyUsed = lineItems.some(
        (item) => item.id !== id && item.serviceSlug === patch.serviceSlug
      );
      if (alreadyUsed) return;
    }

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const merged = { ...item, ...patch };
        const service = getServiceBySlug(merged.serviceSlug);
        if (service) {
          if (!isStayOnlyService(service)) {
            merged.sessions = clampSessionCount(service, merged.sessions);
          } else {
            merged.sessions = 1;
          }
          merged.durationDays = (
            sessionDurationDays === 1 ? 1 : merged.durationDays === 2 ? 2 : 1
          ) as 1 | 2;
        }

        return merged;
      })
    );
  }

  function isLineItemValid(item: CourseLineItem): boolean {
    const service = getServiceBySlug(item.serviceSlug);
    if (!service || item.participants < 1) return false;
    if (item.durationDays > sessionDurationDays) return false;
    if (isStayOnlyService(service)) return true;
    return item.sessions >= 1;
  }

  function canContinue(): boolean {
    if (step === 1) return !!startDate;
    if (step === 2) {
      return lineItems.length > 0 && lineItems.every(isLineItemValid);
    }
    if (step === 3) {
      return !validateBookingExtras(extras, sessionDurationDays);
    }
    return true;
  }

  function goNext() {
    setError("");
    if (step === 2) {
      const invalid = lineItems.find((item) => !isLineItemValid(item));
      if (invalid) {
        const service = getServiceBySlug(invalid.serviceSlug);
        if (service && isStayOnlyService(service)) {
          setError("Add at least one accompanying guest.");
        } else if (invalid.durationDays > sessionDurationDays) {
          setError("An activity lasts longer than the group trip — shorten it or extend the trip.");
        } else if (service && servicePricingUnit(service) === "session") {
          setError("Set at least one session and one participant for each activity.");
        } else {
          setError("Set at least one participant for each activity.");
        }
        return;
      }

      const overSessionLimit = lineItems.find((item) => {
        const service = getServiceBySlug(item.serviceSlug);
        return service && validateSessionCount(service, item.sessions);
      });

      if (overSessionLimit) {
        const service = getServiceBySlug(overSessionLimit.serviceSlug);
        if (service) {
          setError(validateSessionCount(service, overSessionLimit.sessions)!);
        }
        return;
      }
    }
    if (step === 3) {
      const extrasError = validateBookingExtras(extras, sessionDurationDays);
      if (extrasError) {
        setError(extrasError);
        return;
      }
    }
    setStep((s) => Math.min(BOOKING_STEP_COUNT, s + 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError("Please select a start date.");
      setStep(1);
      return;
    }

    const extrasError = validateBookingExtras(extras, sessionDurationDays);
    if (extrasError) {
      setError(extrasError);
      setStep(3);
      return;
    }

    const phoneValidationError = validatePhilippineMobilePhone(customerPhone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setError(phoneValidationError);
      setStep(4);
      return;
    }

    setPhoneError("");
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        tripDurationDays: sessionDurationDays,
        items: lineItems.map(({ serviceSlug, sessions, participants, durationDays }) => ({
          serviceSlug,
          sessions,
          participants,
          durationDays,
        })),
        customerName,
        customerEmail,
        customerPhone: formatPhilippinePhoneE164(customerPhone),
        extras,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Booking failed");
      setSubmitting(false);
      return;
    }

    router.push(
      `/book/success?ref=${encodeURIComponent(data.reference)}&token=${encodeURIComponent(data.token)}`
    );
  }

  const hasNoDates = !loading && !loadError && coachDates.length === 0;
  const hasDatesButNotForDuration =
    !loading &&
    !loadError &&
    coachDates.length > 0 &&
    sessionDates.length === 0;

  return (
    <>
      <section className="hero-gradient border-b border-teal/10">
        <div className="page-container py-8 md:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Reserve your spot</p>
            <h1 className="section-heading mt-3">Book a session</h1>
            <p className="mx-auto mt-4 max-w-xl text-sand-muted">
              Choose your date, pick your activities, and submit your request.
              We&apos;ll confirm within 1–2 business days.
            </p>
          </div>
        </div>
        <div className="wave-divider" />
      </section>

      <div className="page-container py-6 md:py-8">
        {loading ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
            <Loader2 size={32} className="animate-spin text-teal" />
            <p className="text-sand-muted">Loading available dates…</p>
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-lg">
            <div className="card-surface rounded-xl p-8 text-center">
              <CalendarOff size={40} className="mx-auto text-teal/60" />
              <p className="mt-4 text-sand-muted">
                Schedule unavailable.{" "}
                <Link href="/contact" className="text-teal hover:underline">
                  Contact us
                </Link>
              </p>
              {loadError && (
                <p className="mt-3 text-xs text-red-300">{loadError}</p>
              )}
            </div>
          </div>
        ) : hasDatesButNotForDuration ? (
          <div className="mx-auto max-w-lg">
            <div className="card-surface rounded-xl p-8 text-center">
              <CalendarOff size={40} className="mx-auto text-teal/60" />
              <p className="mt-4 font-display text-lg font-semibold text-sand">
                No {sessionDurationDays}-day trips available
              </p>
              <p className="mt-3 text-sm text-sand-muted">
                Coaches are scheduled, but not for consecutive{" "}
                {sessionDurationDays}-day blocks. Try a 1-day trip, or ask us to
                open more dates.
              </p>
              <button
                type="button"
                onClick={() => handleSessionDurationChange(1)}
                className="btn-primary mt-6 inline-flex"
              >
                Switch to 1-day trip
              </button>
            </div>
          </div>
        ) : hasNoDates ? (
          <div className="mx-auto max-w-lg">
            <div className="card-surface rounded-xl p-8 text-center">
              <CalendarOff size={40} className="mx-auto text-teal/60" />
              <p className="mt-4 font-display text-lg font-semibold text-sand">
                No dates available
              </p>
              <p className="mt-3 text-sm text-sand-muted">
                New session dates are added after we confirm with our partner
                resort.
              </p>
              <Link href="/contact" className="btn-primary mt-6 inline-flex">
                Contact us
              </Link>
            </div>
          </div>
        ) : (
          <div className="booking-layout mx-auto max-w-6xl">
            <BookingProgress currentStep={step} />

            <div className="booking-layout-grid">
              <div className="booking-layout-main">
                <form onSubmit={handleSubmit} className="booking-step-panel">
                {error && (
                  <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                {step === 1 && (
                  <div className="booking-date-step">
                    <div className="booking-date-step-header">
                      <div>
                        <h2 className="font-display text-base font-semibold text-sand md:text-lg">
                          When would you like to dive?
                        </h2>
                        <p className="mt-0.5 text-xs text-sand-muted md:text-sm">
                          Pick a session length, then choose an available date
                          below.
                        </p>
                      </div>

                      <DurationSelector
                        value={sessionDurationDays}
                        onChange={handleSessionDurationChange}
                      />
                    </div>

                    <DatePickerGrid
                      dates={availableDates}
                      selectedDate={startDate}
                      durationDays={sessionDurationDays}
                      onSelect={setStartDate}
                    />

                    {startDate && (
                      <p className="rounded-lg border border-teal/20 bg-teal/5 px-3 py-2 text-center text-sm text-sand lg:hidden">
                        Selected:{" "}
                        <strong className="text-teal">
                          {formatBookingDates(startDate, sessionDurationDays)}
                        </strong>
                      </p>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-display text-base font-semibold text-sand md:text-lg">
                          Choose your activities
                        </h2>
                        <p className="mt-0.5 text-xs text-sand-muted md:text-sm">
                          Add one line per activity type. Set headcount for each —
                          they can differ. Use Accompanying guest for stay-only
                          members. On a 2-day trip, each line can be 1 or 2 days.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addLineItem}
                        disabled={!canAddCourse}
                        title={
                          canAddCourse
                            ? undefined
                            : "Every activity is already in this booking"
                        }
                        className="btn-secondary px-3 py-2 text-sm"
                      >
                        <Plus size={15} />
                        Add activity
                      </button>
                    </div>

                    {startDate && (
                      <p className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 text-xs text-sand">
                        <span className="text-sand-muted">Session:</span>
                        <strong className="text-teal">
                          {formatBookingDates(startDate, sessionDurationDays)}
                        </strong>
                      </p>
                    )}

                    <div className="space-y-3">
                      {lineItems.map((item) => (
                        <CourseLineCard
                          key={item.id}
                          item={item}
                          canRemove={lineItems.length > 1}
                          tripDurationDays={sessionDurationDays}
                          expanded={expandedActivityId === item.id}
                          onExpandedChange={(open) =>
                            setExpandedActivityId(open ? item.id : null)
                          }
                          usedServiceSlugs={lineItems
                            .filter((line) => line.id !== item.id)
                            .map((line) => line.serviceSlug)}
                          onUpdate={updateLineItem}
                          onRemove={(id) => {
                            setLineItems((prev) => {
                              const next = prev.filter((l) => l.id !== id);
                              setExpandedActivityId((current) =>
                                current === id ? next[0]?.id ?? null : current
                              );
                              return next;
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <BookingExtrasStep
                    sessionDurationDays={sessionDurationDays}
                    participantCount={participantCount}
                    lineItems={lineItems}
                    value={extras}
                    onChange={setExtras}
                  />
                )}

                {step === 4 && (
                  <BookingContactStep
                    startDate={startDate}
                    sessionDurationDays={sessionDurationDays}
                    bookingUnitsSummary={bookingUnitsSummary}
                    estimatedTotal={estimatedTotal}
                    customerName={customerName}
                    customerEmail={customerEmail}
                    customerPhone={customerPhone}
                    phoneError={phoneError}
                    onCustomerNameChange={setCustomerName}
                    onCustomerEmailChange={setCustomerEmail}
                    onCustomerPhoneChange={(value) => {
                      setCustomerPhone(value);
                      if (phoneError) setPhoneError("");
                    }}
                  />
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-teal/10 pt-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep((s) => s - 1);
                      }}
                      className="btn-secondary"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < BOOKING_STEP_COUNT ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canContinue()}
                      className="btn-primary"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary min-w-[10rem]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Request booking"
                      )}
                    </button>
                  )}
                </div>
              </form>

              <BookingHowTo currentStep={step} />
            </div>

            <BookingSummaryPanel
              step={step}
              startDate={startDate}
              sessionDurationDays={sessionDurationDays}
              lineItems={lineItems}
              participantCount={participantCount}
              extras={extras}
              estimatedTotal={estimatedTotal}
              bookingUnitsSummary={bookingUnitsSummary}
            />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal" />
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
