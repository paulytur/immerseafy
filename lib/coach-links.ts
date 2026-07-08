import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCoaches } from "@/lib/coach-availability";
import type { Coach } from "@/lib/coaches";

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function setCoachProfileLink(
  supabase: SupabaseClient,
  profileId: string,
  coachId: string | null
) {
  await supabase
    .from("coaches")
    .update({ profile_id: null })
    .eq("profile_id", profileId);

  if (!coachId) return;

  await supabase
    .from("coaches")
    .update({ profile_id: null })
    .eq("id", coachId);

  const { error } = await supabase
    .from("coaches")
    .update({ profile_id: profileId })
    .eq("id", coachId);

  if (error) throw new Error(error.message);
}

export async function tryAutoLinkCoachByName(
  supabase: SupabaseClient,
  profileId: string,
  fullName: string
): Promise<Coach | null> {
  const coaches = await fetchCoaches(supabase);
  const normalized = normalizeName(fullName);
  const match = coaches.find(
    (coach) => !coach.profile_id && normalizeName(coach.name) === normalized
  );

  if (!match) return null;

  await setCoachProfileLink(supabase, profileId, match.id);
  return match;
}

export async function findLinkedCoach(
  supabase: SupabaseClient,
  profileId: string
): Promise<Coach | null> {
  const { data } = await supabase
    .from("coaches")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return (data as Coach) ?? null;
}
