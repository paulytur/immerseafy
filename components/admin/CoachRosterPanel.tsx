"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import type { Coach } from "@/lib/coaches";

type CoachOption = Coach & {
  linkedUser?: { full_name: string | null; email: string } | null;
};

const COLLAPSE_THRESHOLD = 6;
const SEARCH_THRESHOLD = 8;

function coachInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CoachChip({ coach }: { coach: CoachOption }) {
  return (
    <span className="admin-coach-chip" title={coach.name}>
      <span className="admin-coach-chip-initials">{coachInitials(coach.name)}</span>
      <span className="admin-coach-chip-name">{coach.name}</span>
      {!coach.profile_id ? (
        <span className="text-[0.625rem] text-sand-muted">· no login</span>
      ) : null}
    </span>
  );
}

export default function CoachRosterPanel({
  coaches,
  expandSignal,
}: {
  coaches: CoachOption[];
  expandSignal?: string | null;
}) {
  const [expanded, setExpanded] = useState(coaches.length <= COLLAPSE_THRESHOLD);
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
    <div className="admin-coach-roster">
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
            {!expanded ? " · tap to browse" : ""}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-teal transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="admin-coach-roster-body">
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
            <div className="admin-coach-roster-scroll">
              <div className="admin-coach-roster-chips">
                {filteredCoaches.map((coach) => (
                  <CoachChip key={coach.id} coach={coach} />
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
