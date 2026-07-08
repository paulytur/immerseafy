import { NextResponse } from "next/server";
import { addDays } from "@/lib/dates";
import { isAdmin } from "@/lib/roles";
import { getStaffSupabase } from "@/lib/supabase/auth";
import { dateRange } from "@/lib/schedule-utils";
import {
  fetchAvailabilityRows,
  fetchCoachForProfile,
  fetchCoaches,
  groupAvailabilityByDate,
} from "@/lib/coach-availability";

function apiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Unauthorized";
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const { supabase, profile } = await getStaffSupabase();

    const [coaches, rows, myCoach] = await Promise.all([
      fetchCoaches(supabase),
      fetchAvailabilityRows(supabase),
      fetchCoachForProfile(supabase, profile.id),
    ]);

    const days = groupAvailabilityByDate(
      rows as Parameters<typeof groupAvailabilityByDate>[0]
    );

    return NextResponse.json({
      coaches,
      days,
      myCoach,
      isAdmin: isAdmin(profile.role),
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await getStaffSupabase();
    const body = await request.json();

    let coachId = body.coachId as string | undefined;
    const maxFromBody = body.dates as string[] | undefined;

    let dates: string[] = maxFromBody ?? [];

    if (!dates.length && body.startDate) {
      const endDate = body.endDate ?? addDays(body.startDate, 1);
      dates = dateRange(body.startDate, endDate);

      if (
        dates.length !== 2 ||
        dates[1] !== addDays(dates[0], 1)
      ) {
        return NextResponse.json(
          { error: "Availability must be exactly 2 consecutive days" },
          { status: 400 }
        );
      }
    }

    if (!dates.length) {
      return NextResponse.json({ error: "Choose at least one date" }, { status: 400 });
    }

    if (!coachId) {
      const myCoach = await fetchCoachForProfile(supabase, profile.id);
      if (!myCoach) {
        return NextResponse.json(
          { error: "Your account is not linked to a coach profile. Ask an admin." },
          { status: 400 }
        );
      }
      coachId = myCoach.id;
    } else if (!isAdmin(profile.role)) {
      const myCoach = await fetchCoachForProfile(supabase, profile.id);
      if (!myCoach || myCoach.id !== coachId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const rows = dates.map((date) => ({ coach_id: coachId!, date }));

    const { data: existing } = await supabase
      .from("coach_availability")
      .select("coach_id, date")
      .eq("coach_id", coachId)
      .in("date", dates);

    const existingKeys = new Set(
      (existing ?? []).map((r) => `${r.coach_id}:${r.date}`)
    );

    const newRows = rows.filter(
      (r) => !existingKeys.has(`${r.coach_id}:${r.date}`)
    );

    if (!newRows.length) {
      return NextResponse.json({ created: 0, skipped: rows.length });
    }

    const { data, error } = await supabase
      .from("coach_availability")
      .insert(newRows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      created: data?.length ?? 0,
      skipped: rows.length - (data?.length ?? 0),
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, profile } = await getStaffSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const coachId = searchParams.get("coachId");
    const date = searchParams.get("date");

    if (id) {
      const { data: row } = await supabase
        .from("coach_availability")
        .select("coach_id")
        .eq("id", id)
        .single();

      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (!isAdmin(profile.role)) {
        const myCoach = await fetchCoachForProfile(supabase, profile.id);
        if (!myCoach || myCoach.id !== row.coach_id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      await supabase.from("coach_availability").delete().eq("id", id);
      return NextResponse.json({ ok: true });
    }

    if (coachId && date) {
      if (!isAdmin(profile.role)) {
        const myCoach = await fetchCoachForProfile(supabase, profile.id);
        if (!myCoach || myCoach.id !== coachId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      await supabase
        .from("coach_availability")
        .delete()
        .eq("coach_id", coachId)
        .eq("date", date);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Missing id or coachId+date" }, { status: 400 });
  } catch (err) {
    return apiError(err);
  }
}
