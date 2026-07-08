import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "@/lib/dates";
import type { Coach, CoachDay } from "@/lib/coaches";

export async function fetchCoaches(supabase: SupabaseClient): Promise<Coach[]> {
  const { data } = await supabase
    .from("coaches")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  return (data ?? []) as Coach[];
}

export async function fetchCoachForProfile(
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

export async function fetchAvailabilityRows(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("coach_availability")
    .select("id, coach_id, date, coaches(*)")
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function groupAvailabilityByDate(
  rows: {
    id: string;
    coach_id: string;
    date: string;
    coaches: Coach | Coach[] | null;
  }[]
): CoachDay[] {
  const map = new Map<string, Coach[]>();

  for (const row of rows) {
    const coach = Array.isArray(row.coaches)
      ? row.coaches[0]
      : row.coaches;
    if (!coach) continue;

    const list = map.get(row.date) ?? [];
    if (!list.some((c) => c.id === coach.id)) {
      list.push(coach);
    }
    map.set(row.date, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, coaches]) => ({
      date,
      coaches: coaches.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export async function getBookableDates(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from("coach_availability")
    .select("date")
    .gte("date", new Date().toISOString().slice(0, 10));

  const dates = [...new Set((data ?? []).map((r) => r.date))];
  return dates.sort();
}

export async function hasCoachesOnDate(
  supabase: SupabaseClient,
  date: string
): Promise<boolean> {
  const { count } = await supabase
    .from("coach_availability")
    .select("*", { count: "exact", head: true })
    .eq("date", date);

  return (count ?? 0) > 0;
}

export function filterConsecutivePairs(dates: string[]): string[] {
  const set = new Set(dates);
  return dates.filter((date) => set.has(addDays(date, 1)));
}

export async function assertCoachesAvailable(
  supabase: SupabaseClient,
  dates: string[]
): Promise<string | null> {
  for (const date of dates) {
    if (!(await hasCoachesOnDate(supabase, date))) {
      return `No coaches available on ${date}`;
    }
  }
  return null;
}
