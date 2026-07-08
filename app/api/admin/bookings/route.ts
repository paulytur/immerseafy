import { NextResponse } from "next/server";
import { getStaffSupabase } from "@/lib/supabase/auth";

function apiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Unauthorized";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { supabase } = await getStaffSupabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("bookings")
      .select("*, session_slots(*), booking_items(*)")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err) {
    return apiError(err);
  }
}
