import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/supabase/auth";
import { canManageAdminOnlyPages } from "@/lib/roles";

export default async function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getStaffProfile();

  if (!profile || !canManageAdminOnlyPages(profile.role)) {
    redirect("/admin");
  }

  return children;
}
