import { NextResponse } from "next/server";
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

    return NextResponse.json({
      user: { id: result.userId, email: String(email).trim().toLowerCase() },
      temporaryPassword: result.temporaryPassword,
      regenerated: result.regenerated,
      linkedCoachName: result.linkedCoachName,
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

      return NextResponse.json({
        ok: true,
        temporaryPassword: result.temporaryPassword,
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
