import { NextResponse } from "next/server";
import { fetchCoaches } from "@/lib/coach-availability";
import { setCoachProfileLink } from "@/lib/coach-links";
import { coachSlugFromName } from "@/lib/coaches";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";

async function uniqueCoachSlug(
  supabase: ReturnType<typeof createAdminClient>,
  baseSlug: string
) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("coaches")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function GET() {
  try {
    await requireAdminProfile();
    const supabase = createAdminClient();
    const coaches = await fetchCoaches(supabase);

    const profileIds = coaches
      .map((coach) => coach.profile_id)
      .filter((id): id is string => Boolean(id));

    let profilesById = new Map<string, { full_name: string | null; email: string }>();

    if (profileIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileIds);

      profilesById = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile])
      );
    }

    return NextResponse.json({
      coaches: coaches.map((coach) => ({
        ...coach,
        linkedUser: coach.profile_id
          ? profilesById.get(coach.profile_id) ?? null
          : null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminProfile();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Coach name is required" }, { status: 400 });
    }

    const baseSlug = coachSlugFromName(name);
    if (!baseSlug) {
      return NextResponse.json(
        { error: "Name must include at least one letter or number" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const slug = await uniqueCoachSlug(supabase, baseSlug);

    const { data: coach, error } = await supabase
      .from("coaches")
      .insert({ name, slug, active: true })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ coach });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminProfile();
    const { profileId, coachId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (coachId) {
      const { data: coach } = await supabase
        .from("coaches")
        .select("id, active")
        .eq("id", coachId)
        .maybeSingle();

      if (!coach?.active) {
        return NextResponse.json({ error: "Coach not found" }, { status: 404 });
      }
    }

    await setCoachProfileLink(supabase, profileId, coachId ?? null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
