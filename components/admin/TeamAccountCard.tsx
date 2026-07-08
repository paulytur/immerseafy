"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Link2,
  Mail,
  Shield,
} from "lucide-react";
import AdminSelect from "@/components/admin/AdminSelect";
import RoleBadge from "@/components/admin/RoleBadge";
import { roleLabel } from "@/lib/roles";
import type { Coach } from "@/lib/coaches";
import type { Profile, UserRole } from "@/lib/types";

const ASSIGNABLE_ROLES: UserRole[] = ["admin", "coach", "instructor"];

type CoachOption = Coach & {
  linkedUser: { full_name: string | null; email: string } | null;
};

type TeamAccountCardProps = {
  user: Profile;
  linkedCoach?: CoachOption;
  coachSelect: { value: string; options: { value: string; label: string }[] };
  linking: boolean;
  resetting: boolean;
  expanded: boolean;
  collapsible: boolean;
  onToggle: () => void;
  onCoachLink: (coachId: string) => void;
  onResetPassword: () => void;
  onRoleChange: (role: UserRole) => void;
};

function isCoachRole(role: UserRole) {
  return role === "coach" || role === "instructor";
}

function userInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleAccent(role: UserRole) {
  if (role === "admin") return "from-amber-500/20 to-transparent";
  if (role === "instructor") return "from-sky-500/20 to-transparent";
  return "from-teal/20 to-transparent";
}

function LinkStatus({
  role,
  linkedCoach,
}: {
  role: UserRole;
  linkedCoach?: CoachOption;
}) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-100">
        <Shield size={12} />
        Full admin access
      </span>
    );
  }

  if (!isCoachRole(role)) return null;

  if (linkedCoach) {
    return (
      <span className="admin-coach-chip">
        <span className="admin-coach-chip-initials">
          {userInitials(linkedCoach.name)}
        </span>
        <span className="admin-coach-chip-name">{linkedCoach.name}</span>
        <CheckCircle2 size={12} className="shrink-0 text-teal" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
      <AlertCircle size={12} />
      Coach profile not linked
    </span>
  );
}

export default function TeamAccountCard({
  user,
  linkedCoach,
  coachSelect,
  linking,
  resetting,
  expanded,
  collapsible,
  onToggle,
  onCoachLink,
  onResetPassword,
  onRoleChange,
}: TeamAccountCardProps) {
  const displayName = user.full_name || user.email;
  const role = ASSIGNABLE_ROLES.includes(user.role) ? user.role : "coach";
  const needsCoachLink = isCoachRole(role) && !linkedCoach;
  const showDetails = !collapsible || expanded;

  return (
    <article
      className={`admin-panel group relative transition-colors hover:border-teal/35 ${
        collapsible && !expanded ? "py-4 md:py-4" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${roleAccent(role)} opacity-0 transition-opacity group-hover:opacity-100`}
        aria-hidden
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div
            className={`admin-avatar shrink-0 text-sm ${
              showDetails ? "h-12 w-12" : "h-10 w-10"
            }`}
          >
            {userInitials(displayName)}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={collapsible ? onToggle : undefined}
                disabled={!collapsible}
                className={`min-w-0 flex-1 text-left ${
                  collapsible
                    ? "cursor-pointer rounded-lg transition-colors hover:text-teal"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`font-display font-semibold text-sand ${
                      showDetails ? "text-lg" : "text-base"
                    }`}
                  >
                    {displayName}
                  </h3>
                  <RoleBadge role={role} />
                </div>

                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-sand-muted">
                  <Mail size={14} className="shrink-0 text-teal" />
                  <span className="truncate">{user.email}</span>
                </p>
              </button>

              {collapsible && (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={expanded}
                  aria-label={
                    expanded ? "Collapse account details" : "Expand account details"
                  }
                  className="btn-secondary shrink-0 px-2.5 py-2"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LinkStatus role={role} linkedCoach={linkedCoach} />
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            <button
              type="button"
              disabled={resetting}
              onClick={onResetPassword}
              className="btn-secondary px-3 py-2 text-sm"
            >
              <KeyRound size={14} />
              {resetting ? "Resetting…" : "Reset password"}
            </button>
            <AdminSelect
              value={role}
              onChange={(value) => onRoleChange(value as UserRole)}
              options={ASSIGNABLE_ROLES.map((option) => ({
                value: option,
                label: roleLabel(option),
              }))}
              className="w-full min-w-[9rem] sm:w-auto"
            />
          </div>
        )}
      </div>

      {showDetails && isCoachRole(role) && (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            needsCoachLink
              ? "border-amber-500/25 bg-amber-500/5"
              : "border-teal/15 bg-ocean-mid/20"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Link2 size={15} className="text-teal" />
            <p className="text-sm font-semibold text-sand">Coach profile</p>
          </div>

          <AdminSelect
            value={coachSelect.value}
            disabled={linking}
            onChange={onCoachLink}
            options={coachSelect.options}
            placeholder="Select roster coach…"
            searchable
            searchPlaceholder="Search coaches…"
          />

          {needsCoachLink && (
            <p className="mt-2.5 text-xs leading-relaxed text-amber-200/90">
              Link this login to a roster name so they can manage their schedule.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
