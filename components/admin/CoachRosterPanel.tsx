"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSearch from "@/components/admin/AdminSearch";
import type { Coach } from "@/lib/coaches";

type CoachOption = Coach & {
  linkedUser?: { full_name: string | null; email: string } | null;
};

const SEARCH_THRESHOLD = 8;

const TABLE_COLUMNS = [
  { key: "name", label: "Coach", className: "col-name" },
  { key: "login", label: "Login", className: "col-login" },
] as const;

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CoachRosterPanel({
  coaches,
  expandSignal,
}: {
  coaches: CoachOption[];
  expandSignal?: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (expandSignal) setExpanded(true);
  }, [expandSignal]);

  const withoutLogin = useMemo(
    () => coaches.filter((coach) => !coach.profile_id).length,
    [coaches]
  );

  const filteredCoaches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coaches;

    return coaches.filter((coach) => coach.name.toLowerCase().includes(normalized));
  }, [coaches, query]);

  if (coaches.length === 0) return null;

  return (
    <div className="admin-coach-roster mt-5">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="admin-coach-roster-toggle"
        aria-expanded={expanded}
      >
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold text-sand">Coach roster</p>
          <p className="mt-0.5 text-xs text-sand-muted">
            {coaches.length} on schedule
            {withoutLogin > 0 ? ` · ${withoutLogin} without login` : ""}
          </p>
        </div>
      </button>

      {expanded ? (
        <div className="admin-coach-roster-body space-y-3">
          {coaches.length >= SEARCH_THRESHOLD ? (
            <AdminSearch
              value={query}
              onChange={setQuery}
              placeholder="Search roster…"
            />
          ) : null}

          {filteredCoaches.length === 0 ? (
            <p className="admin-coach-roster-empty">No coaches match your search.</p>
          ) : (
            <div className="admin-roster-table-wrap">
              <div className="admin-roster-head" role="row">
                {TABLE_COLUMNS.map((column) => (
                  <span
                    key={column.key}
                    className={`admin-roster-head-cell ${column.className}`}
                  >
                    {column.label}
                  </span>
                ))}
              </div>

              <div className="admin-roster-body">
                {filteredCoaches.map((coach) => (
                  <article key={coach.id} className="admin-roster-row">
                    <div className="admin-roster-row-grid" role="row">
                      <div className="admin-roster-cell col-name">
                        <span className="admin-coach-chip-initials">
                          {coachInitials(coach.name)}
                        </span>
                        <span className="truncate font-medium text-sand">
                          {coach.name}
                        </span>
                      </div>
                      <div className="admin-roster-cell col-login">
                        {coach.profile_id ? (
                          <span className="admin-team-account-link-pill admin-team-account-link-pill-admin">
                            Linked
                          </span>
                        ) : (
                          <span className="admin-team-account-link-pill admin-team-account-link-pill-warning">
                            No login
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {query ? (
            <p className="admin-coach-roster-meta">
              Showing {filteredCoaches.length} of {coaches.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
