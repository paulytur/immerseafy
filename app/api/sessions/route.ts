import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getBookableDates } from "@/lib/coach-availability";

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or publishable key in environment");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = createPublicClient();
    const dates = await getBookableDates(supabase);

    return NextResponse.json({ dates });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load schedule";

    if (message.includes("coach_availability")) {
      return NextResponse.json(
        {
          error:
            "Database not set up yet. Run supabase/migrations/008_coach_availability.sql in the Supabase SQL editor.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
