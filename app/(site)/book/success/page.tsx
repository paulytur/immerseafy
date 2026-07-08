import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Mail, Phone } from "lucide-react";
import BookingReferenceCard from "@/components/booking/BookingReferenceCard";
import BookingSummaryDownload from "@/components/booking/BookingSummaryDownload";

export const metadata: Metadata = {
  title: "Booking received",
  description: "Your booking request has been received.",
};

const NEXT_STEPS = [
  {
    icon: Clock,
    title: "We review your request",
    detail: "Our team checks availability with the resort within 1–2 business days.",
  },
  {
    icon: Phone,
    title: "We confirm by phone or email",
    detail: "If your slot is available, we'll reach out with next steps.",
  },
  {
    icon: Mail,
    title: "Payment when approved",
    detail: "You'll receive QR Pay instructions by email once your booking is approved.",
  },
] as const;

export default async function BookSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; token?: string }>;
}) {
  const { ref, token } = await searchParams;
  const canDownload = Boolean(ref && token);

  return (
    <div className="py-12 md:py-20">
      <div className="page-container max-w-xl">
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="booking-success-hero px-6 py-10 text-center md:px-10">
            <CheckCircle2
              size={52}
              className="mx-auto text-teal"
              strokeWidth={1.5}
            />
            <h1 className="mt-4 font-display text-2xl font-semibold text-sand md:text-3xl">
              You&apos;re all set!
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-sand-muted">
              Your booking request is in our queue. Save your reference and
              summary below before leaving this page.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Status: Request received
              </span>
            </div>
          </div>

          <div className="space-y-6 px-6 py-8 md:px-10">
            <section className="booking-success-step">
              <p className="booking-success-step-label">Step 1</p>
              <h2 className="booking-success-step-title">Save your reference</h2>
              {ref ? (
                <BookingReferenceCard reference={ref} />
              ) : (
                <div className="rounded-xl border border-teal/15 bg-ocean-mid/30 px-4 py-3 text-sm text-sand-muted">
                  Your booking was submitted, but we couldn&apos;t show your
                  reference here. Contact us with the name and email you used.
                </div>
              )}
            </section>

            <section className="booking-success-step">
              <p className="booking-success-step-label">Step 2</p>
              <h2 className="booking-success-step-title">
                Download your summary
              </h2>
              <p className="mb-4 text-sm text-sand-muted">
                Your PDF includes the full price breakdown, trip details, and
                booking reference. Keep it for your records.
              </p>
              {canDownload ? (
                <BookingSummaryDownload reference={ref!} token={token!} />
              ) : (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  The download link isn&apos;t available on this page. If you
                  bookmarked this URL without the full link, contact us with
                  your name and email.
                </div>
              )}
            </section>

            <section className="booking-success-next">
              <h2 className="booking-success-next-title">What happens next</h2>
              <ol className="booking-success-next-list">
                {NEXT_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="booking-success-next-item">
                      <span className="booking-success-next-number">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-sand">
                          <Icon size={15} className="shrink-0 text-teal" />
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
            </section>

            <div className="flex flex-col items-center gap-3 border-t border-teal/10 pt-6">
              <Link href="/" className="text-sm font-medium text-teal hover:underline">
                Back to home
              </Link>
              <Link href="/contact" className="text-xs text-sand-muted hover:text-sand">
                Questions? Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
