import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingExpiredEmail, sendPaymentReminderEmail } from "@/lib/email";
import {
  getBookingEmailContext,
  releaseBookingSlots,
} from "@/lib/booking-items";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from("bookings")
    .select("*, session_slots(*)")
    .eq("status", "awaiting_payment")
    .lt("payment_expires_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let expiredCount = 0;
  let reminderCount = 0;

  for (const booking of expired ?? []) {
    await supabase
      .from("bookings")
      .update({ status: "expired" })
      .eq("id", booking.id);

    await releaseBookingSlots(supabase, booking.id);

    const ctx = await getBookingEmailContext(supabase, booking);

    await sendBookingExpiredEmail({
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      summary: ctx.summary,
      date: ctx.date,
      reference: booking.reference,
      totalCents: ctx.totalCents,
    });

    expiredCount++;
  }

  const reminderThreshold = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: reminders } = await supabase
    .from("bookings")
    .select("*, session_slots(*)")
    .eq("status", "awaiting_payment")
    .gt("payment_expires_at", now)
    .lt("payment_expires_at", reminderThreshold);

  for (const booking of reminders ?? []) {
    const ctx = await getBookingEmailContext(supabase, booking);

    await sendPaymentReminderEmail({
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      summary: ctx.summary,
      date: ctx.date,
      reference: booking.reference,
      totalCents: ctx.totalCents,
      paymentToken: booking.payment_token,
    });

    reminderCount++;
  }

  return NextResponse.json({ expiredCount, reminderCount });
}
