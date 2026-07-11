"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  KeyRound,
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

function LinkStatus({
  role,
  linkedCoach,
  compact = false,
}: {
  role: UserRole;
  linkedCoach?: CoachOption;
  compact?: boolean;
}) {
  if (role === "admin") {
    return (
      <span className="admin-team-account-link-pill admin-team-account-link-pill-admin">
        <Shield size={11} />
        {compact ? "Admin" : "Full admin"}
      </span>
    );
  }

  if (!isCoachRole(role)) return <span className="text-sand-muted">—</span>;

  if (linkedCoach) {
    return (
      <span className="admin-coach-chip admin-coach-chip-compact">
        <span className="admin-coach-chip-initials">
          {userInitials(linkedCoach.name)}
        </span>
        <span className="admin-coach-chip-name">{linkedCoach.name}</span>
        <CheckCircle2 size={11} className="shrink-0 text-teal" />
      </span>
    );
  }

  return (
    <span className="admin-team-account-link-pill admin-team-account-link-pill-warning">
      <AlertCircle size={11} />
      Needs link
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
  onToggle,
  onCoachLink,
  onResetPassword,
  onRoleChange,
}: TeamAccountCardProps) {
  const displayName = user.full_name || user.email;
  const role = ASSIGNABLE_ROLES.includes(user.role) ? user.role : "coach";
  const needsCoachLink = isCoachRole(role) && !linkedCoach;

  function handleRowClick(event: React.MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest(".col-actions")) return;
    onToggle();
  }

  return (
    <article
      className={`admin-team-account-row${needsCoachLink ? " admin-team-account-row-needs-link" : ""}`}
    >
      <div
        className="admin-team-account-row-grid"
        role="row"
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
      >
        <div className="admin-team-account-cell col-name">
          <span className="admin-team-account-avatar">{userInitials(displayName)}</span>
          <span className="truncate font-medium text-sand">{displayName}</span>
        </div>

        <div className="admin-team-account-cell col-email">
          <span className="truncate text-sand-muted">{user.email}</span>
        </div>

        <div className="admin-team-account-cell col-role">
          <RoleBadge role={role} compact />
        </div>

        <div className="admin-team-account-cell col-link">
          <LinkStatus role={role} linkedCoach={linkedCoach} compact />
        </div>

        <div className="admin-team-account-cell col-expand">
          {expanded ? (
            <ChevronUp size={14} className="admin-team-account-chevron is-open" />
          ) : (
            <ChevronDown size={14} className="admin-team-account-chevron" />
          )}
        </div>
      </div>

      {expanded ? (
        <div className="admin-team-account-expand">
          <div className="admin-team-account-manage">
            <AdminSelect
              label="Role"
              value={role}
              onChange={(value) => onRoleChange(value as UserRole)}
              options={ASSIGNABLE_ROLES.map((option) => ({
                value: option,
                label: roleLabel(option),
              }))}
              className="admin-team-account-field-role"
            />

            {isCoachRole(role) ? (
              <div
                className={`admin-team-account-field-coach${
                  needsCoachLink ? " admin-team-account-field-coach-warning" : ""
                }`}
              >
                <AdminSelect
                  label="Coach profile"
                  value={coachSelect.value}
                  disabled={linking}
                  onChange={onCoachLink}
                  options={coachSelect.options}
                  placeholder="Select roster coach…"
                  searchable
                  searchPlaceholder="Search coaches…"
                />
              </div>
            ) : (
              <div className="admin-team-account-field-spacer" aria-hidden />
            )}

            <div className="admin-team-account-field-password">
              <span className="form-label">Password</span>
              <button
                type="button"
                disabled={resetting}
                onClick={(event) => {
                  event.stopPropagation();
                  onResetPassword();
                }}
                className="admin-team-account-reset-btn btn-secondary"
                title="Reset password"
                aria-label="Reset password"
              >
                <KeyRound size={12} />
                {resetting ? "Resetting…" : "Reset"}
              </button>
            </div>
          </div>

          {isCoachRole(role) && needsCoachLink ? (
            <p className="admin-team-account-field-hint">
              Link this login to a roster name so they can manage their schedule.
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
