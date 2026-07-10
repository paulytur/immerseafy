"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import { canManageAdminOnlyPages, roleLabel } from "@/lib/roles";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export default function AdminShell({
  children,
  role,
  userName,
}: {
  children: React.ReactNode;
  role: UserRole;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || canManageAdminOnlyPages(role)
  );

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const initials = (userName ?? "Admin")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-ocean-deep">
      <aside className="admin-sidebar flex h-full w-64 shrink-0 flex-col overflow-y-auto p-5">
        <div className="border-b border-teal/10 pb-5">
          <Link
            href="/admin"
            className="font-display text-sm font-bold tracking-wide text-teal uppercase"
          >
            Immerseafy
          </Link>
          <p className="mt-1 text-xs text-sand-muted">Admin dashboard</p>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {visibleLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              data-active={isActive(href, exact)}
              className="admin-nav-link"
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-teal/10 pt-5">
          <div className="flex items-center gap-3 rounded-xl bg-ocean-mid/50 px-3 py-2.5">
            <div className="admin-avatar">{initials}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sand">
                {userName ?? "Staff"}
              </p>
              <p className="text-xs text-teal">{roleLabel(role)}</p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="admin-nav-link text-xs"
          >
            <ExternalLink size={16} />
            View website
          </Link>

          <ThemeToggle variant="admin" />

          <button
            type="button"
            onClick={handleSignOut}
            className="admin-nav-link w-full text-left"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-app min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
