import type { UserRole } from "@/lib/types";

export const USER_ROLES: UserRole[] = [
  "admin",
  "coach",
  "instructor",
  "staff",
];

/** Roles that can use the admin dashboard (not full admin). */
export const LIMITED_DASHBOARD_ROLES: UserRole[] = [
  "coach",
  "instructor",
  "staff",
];

export function isDashboardRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canManageAdminOnlyPages(role: UserRole): boolean {
  return isAdmin(role);
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    coach: "Coach",
    instructor: "Instructor",
    staff: "Staff",
  };
  return labels[role];
}
