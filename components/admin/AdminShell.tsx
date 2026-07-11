"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
    <div className="admin-shell">
      <header className="admin-mobile-header md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="admin-mobile-menu-btn"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold tracking-wide text-teal uppercase">
            Immerseafy
          </p>
          <p className="truncate text-xs text-sand-muted">Admin dashboard</p>
        </div>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}>
        <div className="border-b border-teal/10 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href="/admin"
                className="font-display text-sm font-bold tracking-wide text-teal uppercase"
                onClick={() => setMobileOpen(false)}
              >
                Immerseafy
              </Link>
              <p className="mt-1 text-xs text-sand-muted">Admin dashboard</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="admin-mobile-menu-btn md:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {visibleLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              data-active={isActive(href, exact)}
              className="admin-nav-link"
              onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
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

      <main className="admin-app">
        <div className="admin-app-inner">{children}</div>
      </main>
    </div>
  );
}
