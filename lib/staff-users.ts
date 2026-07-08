import type { SupabaseClient } from "@supabase/supabase-js";
import { tryAutoLinkCoachByName } from "@/lib/coach-links";
import { generateTemporaryPassword } from "@/lib/passwords";
import type { UserRole } from "@/lib/types";

export const MUST_RESET_PASSWORD_KEY = "must_reset_password";

type CreateStaffUserInput = {
  email: string;
  fullName: string;
  role: UserRole;
};

export type CreateStaffUserResult =
  | {
      ok: true;
      userId: string;
      temporaryPassword: string;
      regenerated: boolean;
      linkedCoachName?: string;
    }
  | { ok: false; error: string; hint?: string };

function authErrorMessage(error: {
  message?: string;
  code?: string;
}): string {
  if (error.message?.trim()) return error.message;
  if (error.code === "email_exists") {
    return "A user with this email already exists.";
  }
  return "Failed to create user.";
}

function isDuplicateEmailError(error: {
  message?: string;
  code?: string;
}) {
  return (
    error.code === "email_exists" ||
    error.message?.toLowerCase().includes("already been registered") ||
    error.message?.toLowerCase().includes("already exists")
  );
}

function databaseRoleHint(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  if (
    message.includes("database error") ||
    message.includes("profiles_role_check") ||
    message.includes("check constraint")
  ) {
    return "Run supabase/migrations/009_coach_instructor_roles.sql in the Supabase SQL editor to allow Coach and Instructor roles.";
  }
  return undefined;
}

function staffMetadata(fullName: string, role: UserRole) {
  return {
    full_name: fullName,
    role,
    [MUST_RESET_PASSWORD_KEY]: true,
  };
}

async function findProfileByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return data ? { id: data.id } : null;
}

async function applyStaffCredentials(
  supabase: SupabaseClient,
  userId: string,
  input: {
    email: string;
    fullName: string;
    role: UserRole;
    temporaryPassword: string;
  }
) {
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: staffMetadata(input.fullName, input.role),
  });

  if (authError) {
    return { ok: false as const, error: authErrorMessage(authError) };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      role: input.role,
    })
    .eq("id", userId);

  if (profileError) {
    return {
      ok: false as const,
      error: profileError.message,
      hint: databaseRoleHint(profileError),
    };
  }

  return { ok: true as const };
}

export async function createStaffUser(
  supabase: SupabaseClient,
  input: CreateStaffUserInput
): Promise<CreateStaffUserResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const temporaryPassword = generateTemporaryPassword();

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: staffMetadata(input.fullName, input.role),
    });

  if (createError && isDuplicateEmailError(createError)) {
    const existing = await findProfileByEmail(supabase, normalizedEmail);
    if (!existing) {
      return {
        ok: false,
        error:
          "This email is already registered but has no profile. Fix the account in Supabase.",
      };
    }

    const applied = await applyStaffCredentials(supabase, existing.id, {
      email: normalizedEmail,
      fullName: input.fullName,
      role: input.role,
      temporaryPassword,
    });

    if (!applied.ok) {
      return {
        ok: false,
        error: applied.error,
        hint: "hint" in applied ? applied.hint : undefined,
      };
    }

    return {
      ok: true,
      userId: existing.id,
      temporaryPassword,
      regenerated: true,
      linkedCoachName: await linkCoachAfterCreate(
        supabase,
        existing.id,
        input.fullName,
        input.role
      ),
    };
  }

  if (createError) {
    return {
      ok: false,
      error: authErrorMessage(createError),
      hint: databaseRoleHint(createError),
    };
  }

  if (!created.user) {
    return { ok: false, error: "User was not returned after creation." };
  }

  return {
    ok: true,
    userId: created.user.id,
    temporaryPassword,
    regenerated: false,
    linkedCoachName: await linkCoachAfterCreate(
      supabase,
      created.user.id,
      input.fullName,
      input.role
    ),
  };
}

async function linkCoachAfterCreate(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  role: UserRole
) {
  if (role !== "coach" && role !== "instructor") return undefined;

  const linked = await tryAutoLinkCoachByName(supabase, userId, fullName);
  return linked?.name;
}

export async function resetStaffUserPassword(
  supabase: SupabaseClient,
  userId: string
): Promise<
  | { ok: true; temporaryPassword: string }
  | { ok: false; error: string }
> {
  const temporaryPassword = generateTemporaryPassword();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, error: "User not found." };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: temporaryPassword,
    user_metadata: {
      full_name: profile.full_name,
      role: profile.role,
      [MUST_RESET_PASSWORD_KEY]: true,
    },
  });

  if (error) {
    return { ok: false, error: authErrorMessage(error) };
  }

  return { ok: true, temporaryPassword };
}

export function userMustResetPassword(
  metadata: Record<string, unknown> | undefined
): boolean {
  return metadata?.[MUST_RESET_PASSWORD_KEY] === true;
}
