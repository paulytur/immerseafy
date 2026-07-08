import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateBookingReference,
  generatePaymentToken,
} from "@/lib/references";
import {
  resolveBookingItems,
  reserveBookingSlots,
  type BookingLineItemInput,
} from "@/lib/booking-items";
import {
  normalizeBookingExtras,
  validateBookingExtras,
} from "@/lib/booking-extras";
import {
  formatPhilippinePhoneE164,
  validatePhilippineMobilePhone,
} from "@/lib/phone-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      startDate,
      items,
      customerName,
      customerEmail,
      customerPhone,
      extras: extrasInput,
      // legacy single-slot booking
      sessionSlotId,
      headcount = 1,
    } = body;

    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const phoneValidationError = validatePhilippineMobilePhone(customerPhone);
    if (phoneValidationError) {
      return NextResponse.json({ error: phoneValidationError }, { status: 400 });
    }

    const normalizedPhone = formatPhilippinePhoneE164(customerPhone);

    const supabase = createAdminClient();

    // Legacy path: single service booking
    if (sessionSlotId && !items?.length) {
      const count = Number(headcount);
      if (!Number.isInteger(count) || count < 1) {
        return NextResponse.json({ error: "Invalid headcount" }, { status: 400 });
      }

      const { data: slot, error: slotError } = await supabase
        .from("session_slots")
        .select("*")
        .eq("id", sessionSlotId)
        .eq("status", "open")
        .gte("date", new Date().toISOString().slice(0, 10))
        .single();

      if (slotError || !slot) {
        return NextResponse.json({ error: "Session not available" }, { status: 404 });
      }

      if (slot.booked_count + count > slot.max_slots) {
        return NextResponse.json({ error: "Not enough slots" }, { status: 409 });
      }

      const reference = generateBookingReference(slot.date);
      const paymentToken = generatePaymentToken();

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          session_slot_id: sessionSlotId,
          start_date: slot.date,
          reference,
          payment_token: paymentToken,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: normalizedPhone,
          headcount: count,
          status: "pending",
        })
        .select()
        .single();

      if (bookingError || !booking) {
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
      }

      const newBookedCount = slot.booked_count + count;
      await supabase
        .from("session_slots")
        .update({
          booked_count: newBookedCount,
          status: newBookedCount >= slot.max_slots ? "full" : slot.status,
        })
        .eq("id", sessionSlotId);

      return NextResponse.json({
        id: booking.id,
        reference: booking.reference,
        token: paymentToken,
      });
    }

    // Multi-course booking
    if (!startDate || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Select a start date and at least one course" },
        { status: 400 }
      );
    }

    const lineItems = items as BookingLineItemInput[];
    const tripDurationDays = (
      body.tripDurationDays === 2 ? 2 : body.tripDurationDays === 1 ? 1 : null
    ) as 1 | 2 | null;
    const sessionDurationDays = (
      tripDurationDays ??
      Math.max(...lineItems.map((item) => item.durationDays ?? 1), 1)
    ) as 1 | 2;
    const extras = normalizeBookingExtras(extrasInput, sessionDurationDays);
    const extrasError = validateBookingExtras(extras, sessionDurationDays);

    if (extrasError) {
      return NextResponse.json({ error: extrasError }, { status: 400 });
    }

    const overTripDuration = lineItems.find(
      (item) => (item.durationDays ?? 1) > sessionDurationDays
    );
    if (overTripDuration) {
      return NextResponse.json(
        {
          error:
            "An activity lasts longer than the group trip. Shorten the activity or book a longer trip.",
        },
        { status: 400 }
      );
    }

    const resolved = await resolveBookingItems(supabase, startDate, lineItems);

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const totalHeadcount = resolved.items.reduce((s, i) => s + i.participants, 0);
    const reference = generateBookingReference(startDate);
    const paymentToken = generatePaymentToken();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        start_date: startDate,
        reference,
        payment_token: paymentToken,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: normalizedPhone,
        headcount: totalHeadcount,
        meals_requested: extras.meals,
        carpool_requested: extras.carpool,
        room_requested: extras.room,
        room_decline_reason: extras.room ? null : extras.roomDeclineReason || null,
        status: "pending",
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert failed:", bookingError);
      const detail =
        process.env.NODE_ENV === "development" && bookingError?.message
          ? bookingError.message
          : undefined;
      return NextResponse.json(
        { error: "Failed to create booking", detail },
        { status: 500 }
      );
    }

    try {
      await reserveBookingSlots(supabase, booking.id, resolved.items);
    } catch (err) {
      await supabase.from("bookings").delete().eq("id", booking.id);
      const message = err instanceof Error ? err.message : "Failed to reserve slots";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      id: booking.id,
      reference: booking.reference,
      token: paymentToken,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
