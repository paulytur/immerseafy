import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin, isDashboardRole } from "@/lib/roles";
import { createAdminClient } from "./admin";
import { createClient } from "./server";

export { isAdmin } from "@/lib/roles";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function profileFromMetadata(user: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
}): Profile | null {
  const role = user.user_metadata?.role;
  if (typeof role !== "string" || !isDashboardRole(role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    role: role as UserRole,
    created_at: user.created_at,
  };
}

export async function getStaffProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Metadata first — works even when profiles RLS is broken
  const fromMetadata = profileFromMetadata(user);
  if (fromMetadata) return fromMetadata;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && profile && isDashboardRole(profile.role)) {
    return profile as Profile;
  }

  try {
    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (adminProfile && isDashboardRole(adminProfile.role)) {
      return adminProfile as Profile;
    }
  } catch {
    // Service role key not configured — ignore
  }

  return null;
}

export async function getStaffProfileDebug(): Promise<{
  profile: Profile | null;
  userId: string;
  email: string;
  profileError: string | null;
  usedMetadata: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      userId: "",
      email: "",
      profileError: "Not signed in",
      usedMetadata: false,
    };
  }

  const fromMetadata = profileFromMetadata(user);
  if (fromMetadata) {
    return {
      profile: fromMetadata,
      userId: user.id,
      email: user.email ?? "",
      profileError: null,
      usedMetadata: true,
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const fromDb =
    !error && profile && isDashboardRole(profile.role)
      ? (profile as Profile)
      : null;

  if (fromDb) {
    return {
      profile: fromDb,
      userId: user.id,
      email: user.email ?? "",
      profileError: error?.message ?? null,
      usedMetadata: false,
    };
  }

  return {
    profile: null,
    userId: user.id,
    email: user.email ?? "",
    profileError: error?.message ?? "No profile or metadata role found",
    usedMetadata: false,
  };
}

export async function requireStaffProfile(): Promise<Profile> {
  const profile = await getStaffProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}

export async function getStaffSupabase(): Promise<{
  supabase: SupabaseClient;
  profile: Profile;
}> {
  const profile = await requireStaffProfile();
  const supabase = await createClient();
  return { supabase, profile };
}

export async function requireAdminProfile(): Promise<Profile> {
  const profile = await getStaffProfile();
  if (!profile || !isAdmin(profile.role)) throw new Error("Forbidden");
  return profile;
}
