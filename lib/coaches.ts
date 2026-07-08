export type Coach = {
  id: string;
  profile_id: string | null;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
};

export type CoachAvailability = {
  id: string;
  coach_id: string;
  date: string;
  created_at: string;
};

export type CoachDay = {
  date: string;
  coaches: Coach[];
};

export const COACHES_SEED = [
  { name: "Paul Yturzaita", slug: "paul-yturzaita" },
  { name: "Dominic Rivera", slug: "dominic-rivera" },
  { name: "J-lyn Guevarra", slug: "j-lyn-guevarra" },
  { name: "Zed Tanjista", slug: "zed-tanjista" },
  { name: "Lance Dusaban", slug: "lance-dusaban" },
] as const;

export function coachSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
