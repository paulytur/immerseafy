"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminSearch from "@/components/admin/AdminSearch";
import TeamAccountCard from "@/components/admin/TeamAccountCard";
import { roleLabel } from "@/lib/roles";
import type { Coach } from "@/lib/coaches";
import type { Profile, UserRole } from "@/lib/types";

type CoachOption = Coach & {
  linkedUser: { full_name: string | null; email: string } | null;
};

type TeamAccountsListProps = {
  users: Profile[];
  coachByProfileId: Map<string, CoachOption>;
  linkingId: string | null;
  resettingId: string | null;
  coachLinkOptions: (userId: string) => {
    value: string;
    options: { value: string; label: string }[];
  };
  onCoachLink: (profileId: string, coachId: string) => void;
  onResetPassword: (user: Profile) => void;
  onRoleChange: (id: string, role: UserRole) => void;
};

type AccountFilter = "all" | "admin" | "coach" | "instructor" | "unlinked";

const FILTERS: { value: AccountFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "coach", label: "Coaches" },
  { value: "instructor", label: "Instructors" },
  { value: "unlinked", label: "Needs link" },
];

const ROLE_GROUPS: { key: UserRole; label: string }[] = [
  { key: "admin", label: "Admins" },
  { key: "coach", label: "Coaches" },
  { key: "instructor", label: "Instructors" },
  { key: "staff", label: "Staff" },
];

const SCROLL_THRESHOLD = 6;
const GROUP_THRESHOLD = 10;

const TABLE_COLUMNS = [
  { key: "name", label: "Name", className: "col-name" },
  { key: "email", label: "Email", className: "col-email" },
  { key: "role", label: "Role", className: "col-role" },
  { key: "link", label: "Coach link", className: "col-link" },
  { key: "expand", label: "", className: "col-expand" },
] as const;

function isCoachRole(role: UserRole) {
  return role === "coach" || role === "instructor";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSearch(
  user: Profile,
  query: string,
  linkedCoach?: CoachOption
) {
  if (!query) return true;

  const haystack = [
    user.full_name,
    user.email,
    linkedCoach?.name,
    roleLabel(user.role),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesFilter(
  user: Profile,
  filter: AccountFilter,
  linkedCoach?: CoachOption
) {
  if (filter === "all") return true;
  if (filter === "unlinked") {
    return isCoachRole(user.role) && !linkedCoach;
  }
  return user.role === filter;
}

function TeamAccountsTableHeader() {
  return (
    <div className="admin-team-accounts-head" role="row">
      {TABLE_COLUMNS.map((column) => (
        <span
          key={column.key}
          className={`admin-team-accounts-head-cell ${column.className}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

export default function TeamAccountsList({
  users,
  coachByProfileId,
  linkingId,
  resettingId,
  coachLinkOptions,
  onCoachLink,
  onResetPassword,
  onRoleChange,
}: TeamAccountsListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const normalizedQuery = normalizeSearch(query);
  const useRoleGroups = filter === "all" && users.length >= GROUP_THRESHOLD;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const linkedCoach = coachByProfileId.get(user.id);
      return (
        matchesSearch(user, normalizedQuery, linkedCoach) &&
        matchesFilter(user, filter, linkedCoach)
      );
    });
  }, [users, coachByProfileId, normalizedQuery, filter]);

  const groupedUsers = useMemo(() => {
    if (!useRoleGroups) return null;

    return ROLE_GROUPS.map((group) => ({
      ...group,
      users: filteredUsers.filter((user) => user.role === group.key),
    })).filter((group) => group.users.length > 0);
  }, [filteredUsers, useRoleGroups]);

  useEffect(() => {
    const defaults = new Set<string>();

    for (const user of users) {
      const linkedCoach = coachByProfileId.get(user.id);
      if (isCoachRole(user.role) && !linkedCoach) {
        defaults.add(user.id);
      }
    }

    setExpandedIds(defaults);
  }, [users, coachByProfileId]);

  useEffect(() => {
    if (!useRoleGroups) {
      setCollapsedGroups(new Set());
      return;
    }

    const collapsed = new Set(ROLE_GROUPS.map((group) => group.key));

    for (const group of ROLE_GROUPS) {
      const hasUnlinked = users.some(
        (user) =>
          user.role === group.key &&
          isCoachRole(user.role) &&
          !coachByProfileId.get(user.id)
      );

      if (hasUnlinked) collapsed.delete(group.key);
    }

    setCollapsedGroups(collapsed);
  }, [useRoleGroups, users, coachByProfileId]);

  function toggleExpanded(userId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderUser(user: Profile) {
    return (
      <TeamAccountCard
        key={user.id}
        user={user}
        linkedCoach={coachByProfileId.get(user.id)}
        coachSelect={coachLinkOptions(user.id)}
        linking={linkingId === user.id}
        resetting={resettingId === user.id}
        expanded={expandedIds.has(user.id)}
        onToggle={() => toggleExpanded(user.id)}
        onCoachLink={(coachId) => onCoachLink(user.id, coachId)}
        onResetPassword={() => onResetPassword(user)}
        onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
      />
    );
  }

  function renderTableBody(userList: Profile[]) {
    return (
      <div className="admin-team-accounts-body">{userList.map(renderUser)}</div>
    );
  }

  const shouldScroll = filteredUsers.length > SCROLL_THRESHOLD;

  return (
    <div className="space-y-3">
      <div className="admin-bookings-filters">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Name, email, or coach profile…"
        />

        <div className="admin-filter-panel-tabs">
          <div className="admin-filter-panel-tab-list">
            {FILTERS.map((option) => {
            const count =
              option.value === "all"
                ? users.length
                : users.filter((user) =>
                    matchesFilter(
                      user,
                      option.value,
                      coachByProfileId.get(user.id)
                    )
                  ).length;

            if (option.value === "unlinked" && count === 0) return null;

            return (
              <button
                key={option.value}
                type="button"
                data-active={filter === option.value}
                onClick={() => setFilter(option.value)}
                className="admin-filter-tab"
              >
                {option.label}
                {count > 0 ? (
                  <span className="admin-filter-tab-count">{count}</span>
                ) : null}
              </button>
            );
          })}
          </div>
        </div>

        <p className="text-xs text-sand-muted">
          {filteredUsers.length === users.length
            ? `${users.length} account${users.length === 1 ? "" : "s"}`
            : `Showing ${filteredUsers.length} of ${users.length}`}
          {" · "}tap a row to manage role, password, or coach link
        </p>
      </div>

      {filteredUsers.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No matching accounts"
          description="Try a different search or filter."
        />
      ) : (
        <section className="admin-team-accounts-panel">
          <div
            className={`admin-team-accounts-table-wrap${
              shouldScroll ? " admin-team-accounts-table-scroll" : ""
            }`}
          >
            <TeamAccountsTableHeader />

            {useRoleGroups && groupedUsers ? (
              <div className="admin-team-accounts-groups">
                {groupedUsers.map((group) => {
                  const isOpen = !collapsedGroups.has(group.key);

                  return (
                    <section key={group.key} className="admin-team-accounts-group">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="admin-team-accounts-group-header"
                      >
                        <div>
                          <p className="font-semibold text-sand">{group.label}</p>
                          <p className="text-xs text-sand-muted">
                            {group.users.length} account
                            {group.users.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="booking-pill">{group.users.length}</span>
                          <ChevronDown
                            size={16}
                            className={`text-teal transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen ? renderTableBody(group.users) : null}
                    </section>
                  );
                })}
              </div>
            ) : (
              renderTableBody(filteredUsers)
            )}
          </div>
        </section>
      )}
    </div>
  );
}
