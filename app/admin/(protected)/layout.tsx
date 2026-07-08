import { redirect } from "next/navigation";
import { getStaffProfile, getStaffProfileDebug } from "@/lib/supabase/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const debug = await getStaffProfileDebug();

  if (!debug.userId) redirect("/admin/login");

  if (!debug.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ocean-deep px-4">
        <div className="card-surface max-w-lg rounded-xl p-8">
          <h1 className="font-display text-xl font-semibold text-sand">
            Access not set up
          </h1>
          <p className="mt-3 text-sm text-sand-muted">
            Signed in as <strong>{debug.email}</strong> but the app can&apos;t
            read your admin profile.
          </p>

          <p className="mt-4 text-xs text-sand-muted">
            Your auth user ID:
            <br />
            <code className="text-teal">{debug.userId}</code>
          </p>

          {debug.profileError && (
            <p className="mt-2 text-xs text-amber-400">{debug.profileError}</p>
          )}

          <p className="mt-4 text-sm font-semibold text-sand">
            Run <code className="text-teal">supabase/fix_everything.sql</code> in
            Supabase SQL Editor (fixes recursion + your profile).
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ocean-mid p-3 text-left text-xs text-sand-muted">
            {`-- Quick fix: open supabase/fix_everything.sql in this project
-- Or paste this in Supabase SQL Editor:

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"role": "admin", "full_name": "Admin"}'::jsonb
where email = 'hello@immerseafy.com';`}
          </pre>

          <a href="/admin/login" className="btn-secondary mt-6 inline-flex">
            Sign in again
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      role={debug.profile.role}
      userName={debug.profile.full_name ?? debug.email}
    >
      {children}
    </AdminShell>
  );
}
