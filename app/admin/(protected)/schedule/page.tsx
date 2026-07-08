"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "@/lib/dates";
import { formatBookingDates, groupAvailabilityByTwoDayPeriod } from "@/lib/schedule-utils";
import { CalendarDays, UserCheck, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminLoading from "@/components/admin/AdminLoading";
import AdminSelect from "@/components/admin/AdminSelect";
import AdminDatePicker from "@/components/admin/AdminDatePicker";
import ScheduleAvailabilityList from "@/components/admin/ScheduleAvailabilityList";
import type { Coach, CoachDay } from "@/lib/coaches";

export default function AdminSchedulePage() {
  const [days, setDays] = useState<CoachDay[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [myCoach, setMyCoach] = useState<Coach | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const periods = useMemo(
    () => groupAvailabilityByTwoDayPeriod(days),
    [days]
  );

  async function loadSchedule() {
    const res = await fetch("/api/admin/coach-availability");
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to load schedule");
      setLoading(false);
      return;
    }

    setDays(data.days ?? []);
    setCoaches(data.coaches ?? []);
    setMyCoach(data.myCoach ?? null);
    setIsAdmin(data.isAdmin ?? false);

    if (!selectedCoachId && data.myCoach?.id) {
      setSelectedCoachId(data.myCoach.id);
    } else if (!selectedCoachId && data.coaches?.[0]?.id) {
      setSelectedCoachId(data.coaches[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sessionDate) {
      setError("Choose a start date.");
      return;
    }

    const coachId = isAdmin ? selectedCoachId : myCoach?.id;
    if (!coachId) {
      setError("Select a coach or link your account to a coach profile.");
      return;
    }

    const endDate = addDays(sessionDate, 1);

    setSubmitting(true);

    const res = await fetch("/api/admin/coach-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coachId,
        startDate: sessionDate,
        endDate,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to add availability");
      return;
    }

    setSessionDate("");
    await loadSchedule();
  }

  async function handleRemove(coachId: string, startDate: string) {
    const endDate = addDays(startDate, 1);
    const label = formatBookingDates(startDate, 2);

    if (!confirm(`Remove ${label} from this coach's schedule?`)) return;

    setActing(`${coachId}-${startDate}`);
    setError("");

    for (const date of [startDate, endDate]) {
      const res = await fetch(
        `/api/admin/coach-availability?coachId=${coachId}&date=${encodeURIComponent(date)}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        setActing(null);
        setError(data.error ?? "Failed to remove");
        return;
      }
    }

    setActing(null);
    await loadSchedule();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Team"
        title="Schedule"
        description="Coaches mark 2-day availability. Admin sees who can teach on each consecutive pair."
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleAddAvailability} className="admin-panel h-fit space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="font-semibold text-sand">
                {isAdmin ? "Add availability" : "My dates"}
              </p>
              <p className="text-xs text-sand-muted">2 consecutive days</p>
            </div>
          </div>

          {isAdmin && (
            <AdminSelect
              label="Coach"
              value={selectedCoachId}
              onChange={setSelectedCoachId}
              placeholder="Select coach"
              options={coaches.map((coach) => ({
                value: coach.id,
                label: coach.name,
              }))}
            />
          )}

          {!isAdmin && !myCoach && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Your account isn&apos;t linked to a coach profile yet. Ask an
              admin to link it under{" "}
              <strong className="text-amber-100">Users → Coach profile</strong>
              .
            </p>
          )}

          <AdminDatePicker
            label="Start date"
            value={sessionDate}
            onChange={setSessionDate}
            disabled={!isAdmin && !myCoach}
            twoDayBlock
          />

          <button
            type="submit"
            disabled={submitting || (!isAdmin && !myCoach)}
            className="btn-primary w-full"
          >
            {submitting ? "Saving…" : "Add 2-day block"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-teal" />
              <h2 className="font-display text-lg font-semibold text-sand">
                Who is available
              </h2>
            </div>
            {!loading && periods.length > 0 && (
              <span className="booking-pill">
                {periods.length} block{periods.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loading ? (
            <AdminLoading label="Loading schedule…" />
          ) : periods.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="No 2-day blocks scheduled"
              description="Add coach availability for consecutive day pairs to open bookings."
            />
          ) : (
            <ScheduleAvailabilityList
              periods={periods}
              isAdmin={isAdmin}
              myCoach={myCoach}
              acting={acting}
              onRemove={handleRemove}
            />
          )}
        </div>
      </div>

      {isAdmin && (
        <p className="text-xs text-sand-muted">
          Link coach and instructor logins to roster names under{" "}
          <strong className="text-sand">Users → Coach profile</strong>.
        </p>
      )}
    </div>
  );
}
