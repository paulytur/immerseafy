import { NextResponse } from "next/server";
import { getStaffSupabase } from "@/lib/supabase/auth";
import {
  getServiceBySlug,
  SESSION_SERVICE_SLUGS,
  CERTIFICATION_SERVICE_SLUGS,
} from "@/lib/services-catalog";
import {
  dateRange,
  expandDatesForTwoDayServices,
} from "@/lib/schedule-utils";

function apiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Unauthorized";
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

type SlotInsert = {
  service_slug: string;
  date: string;
  max_slots: number;
  price_cents: number;
  status: "open";
};

function buildSlotRows(
  serviceSlugs: string[],
  dates: string[],
  maxSlots: number
): SlotInsert[] {
  const rows: SlotInsert[] = [];

  for (const serviceSlug of serviceSlugs) {
    const service = getServiceBySlug(serviceSlug);
    if (!service) continue;

    for (const date of dates) {
      rows.push({
        service_slug: serviceSlug,
        date,
        max_slots: maxSlots,
        price_cents: service.priceCents,
        status: "open",
      });
    }
  }

  return rows;
}

async function slotHasActiveBookings(
  supabase: Awaited<ReturnType<typeof getStaffSupabase>>["supabase"],
  slotId: string
) {
  const { count: legacyCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("session_slot_id", slotId)
    .in("status", ["pending", "awaiting_payment", "confirmed"]);

  const { data: itemSlots } = await supabase
    .from("booking_item_slots")
    .select("booking_items(booking_id)")
    .eq("session_slot_id", slotId);

  if (!itemSlots?.length) {
    return (legacyCount ?? 0) > 0;
  }

  const bookingIds = [
    ...new Set(
      itemSlots
        .map((row) => {
          const item = row.booking_items as
            | { booking_id: string }
            | { booking_id: string }[]
            | null;
          if (Array.isArray(item)) return item[0]?.booking_id;
          return item?.booking_id;
        })
        .filter(Boolean) as string[]
    ),
  ];

  if (bookingIds.length === 0) {
    return (legacyCount ?? 0) > 0;
  }

  const { count: multiCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .in("id", bookingIds)
    .in("status", ["pending", "awaiting_payment", "confirmed"]);

  return (legacyCount ?? 0) > 0 || (multiCount ?? 0) > 0;
}

async function insertSlotRows(
  supabase: Awaited<ReturnType<typeof getStaffSupabase>>["supabase"],
  rows: SlotInsert[]
) {
  if (!rows.length) {
    return { created: 0, skipped: 0, slots: [] };
  }

  const dates = [...new Set(rows.map((r) => r.date))];
  const serviceSlugs = [...new Set(rows.map((r) => r.service_slug))];

  const { data: existing } = await supabase
    .from("session_slots")
    .select("service_slug, date")
    .in("date", dates)
    .in("service_slug", serviceSlugs);

  const existingKeys = new Set(
    (existing ?? []).map((row) => `${row.service_slug}:${row.date}`)
  );

  const newRows = rows.filter(
    (row) => !existingKeys.has(`${row.service_slug}:${row.date}`)
  );

  if (!newRows.length) {
    return { created: 0, skipped: rows.length, slots: [] };
  }

  const { data, error } = await supabase
    .from("session_slots")
    .insert(newRows)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return {
    created: data?.length ?? 0,
    skipped: rows.length - (data?.length ?? 0),
    slots: data ?? [],
  };
}

export async function GET() {
  try {
    const { supabase } = await getStaffSupabase();

    const { data, error } = await supabase
      .from("session_slots")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slots: data ?? [] });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await getStaffSupabase();
    const body = await request.json();
    const maxSlots = Number(body.maxSlots) || 4;

    // Coach session day / weekend — opens all session courses at once
    if (body.type === "session") {
      const startDate = body.startDate as string;
      const endDate = (body.endDate as string) || startDate;

      if (!startDate) {
        return NextResponse.json({ error: "Choose a date" }, { status: 400 });
      }

      if (endDate < startDate) {
        return NextResponse.json(
          { error: "End date must be on or after start date" },
          { status: 400 }
        );
      }

      let dates = dateRange(startDate, endDate);

      if (body.includeFollowUpDayForTwoDayCourses !== false) {
        dates = expandDatesForTwoDayServices(dates);
      }

      const rows = buildSlotRows(SESSION_SERVICE_SLUGS, dates, maxSlots);
      const result = await insertSlotRows(supabase, rows);

      return NextResponse.json(result);
    }

    // Certification course — Wave 1 / Wave 2 only
    if (body.type === "certification") {
      const { serviceSlug, date } = body;

      if (!CERTIFICATION_SERVICE_SLUGS.includes(serviceSlug)) {
        return NextResponse.json(
          { error: "Certification scheduling is for Wave 1 or Wave 2 only" },
          { status: 400 }
        );
      }

      const service = getServiceBySlug(serviceSlug);
      if (!service || !date) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      const rows = buildSlotRows([serviceSlug], [date], maxSlots);
      const result = await insertSlotRows(supabase, rows);

      if (result.created === 0 && result.skipped > 0) {
        return NextResponse.json(
          { error: "This certification date is already scheduled" },
          { status: 409 }
        );
      }

      return NextResponse.json(result);
    }

    // Legacy bulk API (kept for compatibility)
    if (Array.isArray(body.serviceSlugs) && body.serviceSlugs.length > 0) {
      const serviceSlugs = body.serviceSlugs as string[];
      let dates: string[] = Array.isArray(body.dates) ? body.dates : [];

      if (!dates.length && body.startDate && body.endDate) {
        dates = dateRange(body.startDate, body.endDate);
      }

      if (!dates.length) {
        return NextResponse.json(
          { error: "Provide dates or a start/end range" },
          { status: 400 }
        );
      }

      if (body.includeFollowUpDayForTwoDayCourses) {
        dates = expandDatesForTwoDayServices(dates, serviceSlugs);
      }

      const rows = buildSlotRows(serviceSlugs, dates, maxSlots);
      const result = await insertSlotRows(supabase, rows);
      return NextResponse.json(result);
    }

    // Legacy single slot
    const { serviceSlug, date, priceCents } = body;
    const service = getServiceBySlug(serviceSlug);

    if (!service || !date) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("session_slots")
      .insert({
        service_slug: serviceSlug,
        date,
        max_slots: maxSlots,
        price_cents: priceCents ?? service.priceCents,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already scheduled on that date" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ slot: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase } = await getStaffSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const date = searchParams.get("date");
    const type = searchParams.get("type");

    // Remove all session courses for a coach day
    if (type === "session" && date) {
      const { data: daySlots } = await supabase
        .from("session_slots")
        .select("id")
        .eq("date", date)
        .in("service_slug", SESSION_SERVICE_SLUGS);

      if (!daySlots?.length) {
        return NextResponse.json({ error: "No session found" }, { status: 404 });
      }

      for (const slot of daySlots) {
        if (await slotHasActiveBookings(supabase, slot.id)) {
          return NextResponse.json(
            { error: "Cannot remove a session day with active bookings" },
            { status: 409 }
          );
        }
      }

      const { error } = await supabase
        .from("session_slots")
        .delete()
        .eq("date", date)
        .in("service_slug", SESSION_SERVICE_SLUGS);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (await slotHasActiveBookings(supabase, id)) {
      return NextResponse.json(
        { error: "Cannot delete slot with active bookings" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("session_slots").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
