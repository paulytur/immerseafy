import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, QrCode } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/services-catalog";
import { getBookingEmailContext } from "@/lib/booking-items";
import { paymentBreakdown } from "@/lib/payment-amounts";
import { BOOKING_STATUS_LABELS } from "@/lib/references";
import BookingSummaryDownload from "@/components/booking/BookingSummaryDownload";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your booking payment via QR Pay.",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, session_slots(*)")
    .eq("payment_token", token)
    .single();

  if (!booking || booking.status !== "awaiting_payment") {
    notFound();
  }

  const ctx = await getBookingEmailContext(supabase, booking);
  const { depositCents, balanceCents, depositPercent } = paymentBreakdown(
    ctx.totalCents
  );

  const { data: settings } = await supabase
    .from("site_settings")
    .select("qr_pay_image_url")
    .eq("id", 1)
    .single();

  const expiresAt = booking.payment_expires_at
    ? new Date(booking.payment_expires_at).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="py-16 md:py-24">
      <div className="page-container max-w-md">
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="border-b border-teal/10 px-6 py-8 text-center">
            <p className="eyebrow">{BOOKING_STATUS_LABELS.awaiting_payment}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-sand">
              Complete your booking
            </h1>
            <p className="mt-2 text-sm text-sand-muted">{ctx.date}</p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="rounded-xl border border-teal/15 bg-ocean-mid/30 px-4 py-3 text-sm text-sand">
              {ctx.summary}
            </div>

            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-sand-muted">
                Deposit due ({depositPercent}%)
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-teal">
                {formatPrice(depositCents)}
              </p>
              <p className="mt-2 text-sm text-sand-muted">
                Estimated total {formatPrice(ctx.totalCents)} · Balance on
                arrival {formatPrice(balanceCents)}
              </p>
              <p className="mt-2 text-sm text-sand-muted">
                Ref{" "}
                <span className="font-mono font-semibold text-sand">
                  {booking.reference}
                </span>
              </p>
            </div>

            {expiresAt && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
                  <Clock size={16} />
                  Pay deposit by {expiresAt}
                </div>
                <p className="text-center text-xs text-sand-muted">
                  Send your {depositPercent}% deposit by this deadline to hold
                  your slot.
                </p>
              </div>
            )}

            {settings?.qr_pay_image_url ? (
              <div className="rounded-xl bg-white p-5 shadow-inner">
                <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-ocean-light">
                  <QrCode size={14} />
                  Scan to pay
                </div>
                <div className="flex justify-center">
                  <Image
                    src={settings.qr_pay_image_url}
                    alt="QR Pay"
                    width={240}
                    height={240}
                    className="h-56 w-56 object-contain"
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-sand-muted">
                QR Pay image not configured. Contact us to complete payment.
              </p>
            )}

            <BookingSummaryDownload
              reference={booking.reference}
              token={token}
              className="btn-secondary w-full justify-center"
            />

            <ol className="space-y-2 text-sm text-sand-muted">
              <li className="flex gap-2">
                <span className="font-semibold text-teal">1.</span>
                Scan with your banking or e-wallet app
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal">2.</span>
                Pay exactly {formatPrice(depositCents)} (50% deposit)
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal">3.</span>
                Include ref {booking.reference} in payment notes
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal">4.</span>
                We&apos;ll email your deposit invoice once confirmed. Pay the
                balance on arrival.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
