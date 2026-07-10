import { NextResponse } from "next/server";
import { sendStaffCredentialsEmail } from "@/lib/email";
import { roleLabel } from "@/lib/roles";
import { createStaffUser, resetStaffUserPassword } from "@/lib/staff-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/supabase/auth";
import type { UserRole } from "@/lib/types";

const CREATABLE_ROLES: UserRole[] = ["admin", "coach", "instructor"];

export async function GET() {
  try {
    await requireAdminProfile();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
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
    const { email, fullName, role } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!role || !CREATABLE_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const result = await createStaffUser(supabase, {
      email: String(email),
      fullName: String(fullName),
      role: role as UserRole,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          hint: result.hint,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailResult = await sendStaffCredentialsEmail({
      email: normalizedEmail,
      fullName: String(fullName),
      role: roleLabel(role as UserRole),
      temporaryPassword: result.temporaryPassword,
      regenerated: result.regenerated,
    });

    return NextResponse.json({
      user: { id: result.userId, email: normalizedEmail },
      temporaryPassword: result.temporaryPassword,
      regenerated: result.regenerated,
      linkedCoachName: result.linkedCoachName,
      emailResult,
    });
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
    const { id, role, fullName, resetPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (resetPassword) {
      const result = await resetStaffUserPassword(supabase, id);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, role")
        .eq("id", id)
        .single();

      const emailResult = profile
        ? await sendStaffCredentialsEmail({
            email: profile.email,
            fullName: profile.full_name ?? profile.email,
            role: roleLabel(profile.role),
            temporaryPassword: result.temporaryPassword,
            regenerated: true,
          })
        : { skipped: true as const, reason: "User profile not found" };

      return NextResponse.json({
        ok: true,
        temporaryPassword: result.temporaryPassword,
        emailResult,
      });
    }

    const updates: Record<string, string> = {};
    if (role && CREATABLE_ROLES.includes(role as UserRole)) {
      updates.role = role;
    }
    if (fullName) updates.full_name = fullName;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : 401 }
    );
  }
}
