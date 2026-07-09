"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, UserCircle, UserPlus, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminLoading from "@/components/admin/AdminLoading";
import AdminSelect from "@/components/admin/AdminSelect";
import TeamAccountsList from "@/components/admin/TeamAccountsList";
import CoachRosterPanel from "@/components/admin/CoachRosterPanel";
import { roleLabel } from "@/lib/roles";
import type { Coach } from "@/lib/coaches";
import type { Profile, UserRole } from "@/lib/types";

const ASSIGNABLE_ROLES: UserRole[] = ["admin", "coach", "instructor"];

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  coach: 1,
  instructor: 2,
  staff: 3,
};

function sortUsers(users: Profile[]) {
  return [...users].sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    if (roleDiff !== 0) return roleDiff;
    return (a.full_name || a.email).localeCompare(b.full_name || b.email);
  });
}

type CoachOption = Coach & {
  linkedUser: { full_name: string | null; email: string } | null;
};

function isCoachRole(role: UserRole) {
  return role === "coach" || role === "instructor";
}

type RevealedCredentials = {
  email: string;
  temporaryPassword: string;
  regenerated: boolean;
};

function CredentialReveal({
  credentials,
  linkedCoachName,
  onDismiss,
}: {
  credentials: RevealedCredentials;
  linkedCoachName?: string;
  onDismiss: () => void;
}) {
  async function copyPassword() {
    await navigator.clipboard.writeText(credentials.temporaryPassword);
  }

  return (
    <div className="admin-panel border-amber-500/30 bg-amber-500/10">
      <p className="font-semibold text-amber-100">
        {credentials.regenerated ? "New temporary password" : "Account created"}
      </p>
      <p className="mt-2 text-sm text-sand-muted">
        Share these credentials with <strong>{credentials.email}</strong> in
        person. This password is shown once and is not stored in plain text.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-muted">Email</p>
          <p className="mt-1 font-medium text-sand">{credentials.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-sand-muted">
            Temporary password
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-teal/15 bg-ocean-deep/60 px-3 py-2 font-mono text-sm text-teal">
              {credentials.temporaryPassword}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="btn-secondary px-3 py-2"
              aria-label="Copy password"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-sand-muted">
        They must sign in and set a new password on first login. After that, only
        the hashed password remains in the database.
        {linkedCoachName
          ? ` Linked to coach profile: ${linkedCoachName}.`
          : " Link their coach profile below if the name did not auto-match."}
      </p>

      <button type="button" onClick={onDismiss} className="btn-primary mt-4">
        I&apos;ve saved the password
      </button>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("coach");
  const [error, setError] = useState("");
  const [coachRosterError, setCoachRosterError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingCoach, setAddingCoach] = useState(false);
  const [coachRosterName, setCoachRosterName] = useState("");
  const [coachAddedName, setCoachAddedName] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealedCredentials | null>(null);
  const [linkedCoachName, setLinkedCoachName] = useState<string | undefined>();
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const coachByProfileId = useMemo(() => {
    const map = new Map<string, CoachOption>();
    for (const coach of coaches) {
      if (coach.profile_id) map.set(coach.profile_id, coach);
    }
    return map;
  }, [coaches]);

  const sortedUsers = useMemo(() => sortUsers(users), [users]);

  const linkedCoachCount = useMemo(
    () =>
      sortedUsers.filter(
        (user) =>
          isCoachRole(user.role) && coachByProfileId.has(user.id)
      ).length,
    [sortedUsers, coachByProfileId]
  );

  const coachAccountCount = useMemo(
    () => sortedUsers.filter((user) => isCoachRole(user.role)).length,
    [sortedUsers]
  );

  async function loadCoaches() {
    const res = await fetch("/api/admin/coaches");
    const data = await res.json();
    setCoaches(data.coaches ?? []);
  }

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadUsers(), loadCoaches()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddCoach(e: React.FormEvent) {
    e.preventDefault();
    setCoachRosterError("");
    setCoachAddedName(null);
    setAddingCoach(true);

    const name = coachRosterName.trim();

    const res = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setAddingCoach(false);

    if (!res.ok) {
      setCoachRosterError(data.error ?? "Failed to add coach");
      return;
    }

    setCoachRosterName("");
    setCoachAddedName(data.coach?.name ?? name);
    await loadCoaches();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRevealed(null);
    setSubmitting(true);

    const createdEmail = email.trim().toLowerCase();

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: createdEmail, fullName, role }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(
        [data.error, data.hint].filter(Boolean).join(" ") ||
          "Failed to create account"
      );
      return;
    }

    setEmail("");
    setFullName("");
    setRevealed({
      email: createdEmail,
      temporaryPassword: data.temporaryPassword,
      regenerated: Boolean(data.regenerated),
    });
    setLinkedCoachName(data.linkedCoachName);
    await loadAll();
  }

  async function updateCoachLink(profileId: string, coachId: string) {
    setLinkingId(profileId);
    setError("");

    const res = await fetch("/api/admin/coaches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        coachId: coachId || null,
      }),
    });

    const data = await res.json();
    setLinkingId(null);

    if (!res.ok) {
      setError(data.error ?? "Failed to link coach profile");
      return;
    }

    await loadCoaches();
  }

  async function updateRole(id: string, newRole: UserRole) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    await loadAll();
  }

  function coachLinkOptions(userId: string) {
    const linked = coachByProfileId.get(userId);
    const options = [{ value: "", label: "Not linked" }];

    for (const coach of coaches) {
      const taken =
        coach.profile_id && coach.profile_id !== userId
          ? ` · ${coach.linkedUser?.full_name || coach.linkedUser?.email || "assigned"}`
          : "";

      options.push({
        value: coach.id,
        label: `${coach.name}${taken}`,
      });
    }

    return { value: linked?.id ?? "", options };
  }

  async function handleResetPassword(user: Profile) {
    if (
      !confirm(
        `Generate a new temporary password for ${user.full_name || user.email}? They will need to set a new password on next login.`
      )
    ) {
      return;
    }

    setError("");
    setRevealed(null);
    setResettingId(user.id);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, resetPassword: true }),
    });

    const data = await res.json();
    setResettingId(null);

    if (!res.ok) {
      setError(data.error ?? "Failed to reset password");
      return;
    }

    setRevealed({
      email: user.email,
      temporaryPassword: data.temporaryPassword,
      regenerated: true,
    });
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Access"
        title="Users"
        description="Add coaches to the roster, create logins, and link profiles for self-managed schedules."
      />

      {revealed && (
        <CredentialReveal
          credentials={revealed}
          linkedCoachName={linkedCoachName}
          onDismiss={() => {
            setRevealed(null);
            setLinkedCoachName(undefined);
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="admin-panel">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
              <UserPlus size={20} />
            </div>
            <div>
              <p className="font-semibold text-sand">Create account</p>
              <p className="text-xs text-sand-muted">Login for admin, coach, or instructor</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
            <AdminSelect
              label="Role"
              value={role}
              onChange={(value) => setRole(value as UserRole)}
              options={ASSIGNABLE_ROLES.map((option) => ({
                value: option,
                label: roleLabel(option),
              }))}
            />
          </div>

          <p className="mt-4 text-sm text-sand-muted">
            A temporary password is generated once and shown only to you here.
            {isCoachRole(role) &&
              " Match the roster name exactly (e.g. Paul Yturzaita) to auto-link the coach profile."}
          </p>

          <button type="submit" disabled={submitting} className="btn-primary mt-5">
            {submitting ? "Creating account…" : "Create account"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>

        <form onSubmit={handleAddCoach} className="admin-panel">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
              <UserCircle size={20} />
            </div>
            <div>
              <p className="font-semibold text-sand">Add coach</p>
              <p className="text-xs text-sand-muted">Roster name for schedule & bookings</p>
            </div>
          </div>

          <div>
            <label className="form-label">Coach name</label>
            <input
              required
              value={coachRosterName}
              onChange={(e) => setCoachRosterName(e.target.value)}
              placeholder="e.g. Alex Santos"
              className="form-input"
            />
          </div>

          <p className="mt-4 text-sm text-sand-muted">
            Adds them to the schedule roster. No login required unless they will
            manage their own dates — then create an account and link the profile
            below.
          </p>

          {coachAddedName ? (
            <p className="mt-4 text-sm text-sand">
              <strong className="text-teal">{coachAddedName}</strong> added to the
              roster. They now appear in Schedule.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={addingCoach}
            className="btn-primary mt-5"
          >
            {addingCoach ? "Adding coach…" : "Add coach"}
          </button>
          {coachRosterError && (
            <p className="mt-3 text-sm text-red-400">{coachRosterError}</p>
          )}

          <CoachRosterPanel coaches={coaches} expandSignal={coachAddedName} />
        </form>
      </div>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-sand">
              Team accounts
            </h2>
            <p className="mt-1 text-sm text-sand-muted">
              Manage roles, coach links, and password resets.
            </p>
          </div>
          {!loading && users.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="booking-pill">
                {users.length} account{users.length === 1 ? "" : "s"}
              </span>
              {coachAccountCount > 0 && (
                <span className="booking-pill">
                  {linkedCoachCount}/{coachAccountCount} coaches linked
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <AdminLoading label="Loading team accounts…" />
        ) : users.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="No users yet"
            description="Create the first staff or admin account above."
          />
        ) : (
          <TeamAccountsList
            users={sortedUsers}
            coachByProfileId={coachByProfileId}
            linkingId={linkingId}
            resettingId={resettingId}
            coachLinkOptions={coachLinkOptions}
            onCoachLink={updateCoachLink}
            onResetPassword={handleResetPassword}
            onRoleChange={updateRole}
          />
        )}
      </section>
    </div>
  );
}
