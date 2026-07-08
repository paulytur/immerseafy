import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPaymentEmail, sendInvoiceEmail } from "@/lib/email";
import { generateInvoiceNumber } from "@/lib/references";
import { generateInvoicePdf } from "@/lib/invoice";
import { getStaffSupabase } from "@/lib/supabase/auth";
import {
  getBookingEmailContext,
  releaseBookingSlots,
} from "@/lib/booking-items";
import { breakdownLinesFromDbItems } from "@/lib/booking-breakdown";
import {
  bookingGroupHeadcount,
  extrasFromBookingRecord,
} from "@/lib/booking-extras";

async function getBooking(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from("bookings")
    .select("*, session_slots(*)")
    .eq("id", id)
    .single();
  return data;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { supabase, profile } = await getStaffSupabase();
    const { action } = await request.json();

    const booking = await getBooking(supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ctx = await getBookingEmailContext(supabase, booking);

    const emailCtx = {
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      summary: ctx.summary,
      date: ctx.date,
      reference: booking.reference,
      totalCents: ctx.totalCents,
      paymentToken: booking.payment_token,
    };

    if (action === "approve") {
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const { data: settings } = await supabase
        .from("site_settings")
        .select("payment_expiry_hours")
        .eq("id", 1)
        .single();

      const hours = settings?.payment_expiry_hours ?? 120;
      const paymentExpiresAt = new Date(
        Date.now() + hours * 60 * 60 * 1000
      ).toISOString();

      await supabase
        .from("bookings")
        .update({
          status: "awaiting_payment",
          approved_at: new Date().toISOString(),
          approved_by: profile.id,
          payment_expires_at: paymentExpiresAt,
        })
        .eq("id", id);

      await sendPaymentEmail({ ...emailCtx, paymentExpiresAt });
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);

      await releaseBookingSlots(supabase, id);
      return NextResponse.json({ ok: true });
    }

    if (action === "confirm_payment") {
      if (booking.status !== "awaiting_payment") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const paidAt = new Date().toISOString();
      const invoiceNumber = generateInvoiceNumber(ctx.date);

      await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          paid_at: paidAt,
          confirmed_by: profile.id,
        })
        .eq("id", id);

      const extras = extrasFromBookingRecord(booking);
      const sessionDurationDays = (
        ctx.items.length > 0
          ? Math.max(...ctx.items.map((item) => item.duration_days), 1)
          : 1
      ) as 1 | 2;
      const participantCount =
        ctx.items.length > 0
          ? bookingGroupHeadcount(ctx.items)
          : Math.max(1, booking.headcount);

      const lineItems =
        ctx.items.length > 0
          ? breakdownLinesFromDbItems(
              ctx.items,
              extras,
              sessionDurationDays,
              participantCount
            ).map((item) => ({
              label: item.subtitle ? `${item.label} — ${item.subtitle}` : item.label,
              amountCents: item.amountCents,
            }))
          : [
              {
                label: ctx.summary,
                amountCents: ctx.totalCents,
              },
            ];

      const pdfBytes = await generateInvoicePdf({
        invoiceNumber,
        reference: booking.reference,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        date: ctx.date,
        headcount: booking.headcount,
        totalCents: ctx.totalCents,
        paidAt,
        lineItems,
      });

      const pdfPath = `${invoiceNumber}.pdf`;
      await supabase.storage.from("invoices").upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

      await supabase.from("invoices").insert({
        booking_id: id,
        invoice_number: invoiceNumber,
        pdf_path: pdfPath,
        sent_at: new Date().toISOString(),
      });

      await sendInvoiceEmail({ ...emailCtx, invoiceNumber }, pdfBytes);
      return NextResponse.json({ ok: true, invoiceNumber });
    }

    if (action === "cancel") {
      if (!["pending", "awaiting_payment", "confirmed"].includes(booking.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);

      await releaseBookingSlots(supabase, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
