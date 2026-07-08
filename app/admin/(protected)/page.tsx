import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import DashboardAttention from "@/components/admin/DashboardAttention";
import DashboardPaymentDeadlines from "@/components/admin/DashboardPaymentDeadlines";
import DashboardUpcomingTrips from "@/components/admin/DashboardUpcomingTrips";
import {
  buildDashboardAlerts,
  buildDashboardTrips,
  buildPaymentDeadlines,
  countExpiringPayments,
  upcomingConfirmedPax,
  upcomingPeriodsFromDays,
} from "@/lib/dashboard";
import {
  fetchAvailabilityRows,
  groupAvailabilityByDate,
} from "@/lib/coach-availability";
import type { BookingWithSlot } from "@/lib/types";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = todayString();

  const [pending, awaiting, bookingsResult, availabilityResult] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "awaiting_payment"),
      supabase
        .from("bookings")
        .select("*, booking_items(*), session_slots(*)")
        .in("status", ["pending", "awaiting_payment", "confirmed"])
        .order("start_date", { ascending: true }),
      fetchAvailabilityRows(supabase).catch(() => []),
    ]);

  const bookings = (bookingsResult.data ?? []) as BookingWithSlot[];
  const days = groupAvailabilityByDate(
    availabilityResult as Parameters<typeof groupAvailabilityByDate>[0]
  );
  const periods = upcomingPeriodsFromDays(days, today);
  const trips = buildDashboardTrips(periods, bookings, today);
  const paymentDeadlines = buildPaymentDeadlines(bookings);
  const expiringPaymentCount = countExpiringPayments(bookings);
  const tripsMissingCoaches = trips.filter((trip) => trip.needsCoaches).length;
  const confirmedPax = upcomingConfirmedPax(bookings, today);

  const alerts = buildDashboardAlerts({
    pendingCount: pending.count ?? 0,
    expiringPaymentCount,
    tripsMissingCoaches,
    upcomingScheduleBlocks: periods.length,
  });

  const stats = [
    {
      label: "Pending approval",
      value: pending.count ?? 0,
      href: "/admin/bookings?status=pending",
      icon: Clock,
      accent: "amber" as const,
    },
    {
      label: "Awaiting",
      value: awaiting.count ?? 0,
      href: "/admin/bookings?status=awaiting_payment",
      icon: Calendar,
      accent: "teal" as const,
    },
    {
      label: "Confirmed guests",
      value: confirmedPax,
      href: "/admin/bookings?status=confirmed",
      icon: Users,
      accent: "emerald" as const,
    },
    {
      label: "Schedule blocks",
      value: periods.length,
      href: "/admin/schedule",
      icon: CheckCircle2,
      accent: "teal" as const,
    },
  ];

  const quickLinks = [
    {
      href: "/admin/bookings?status=pending",
      label: "Review pending bookings",
      description: "Approve requests and send payment links",
    },
    {
      href: "/admin/schedule",
      label: "Update coach schedule",
      description: "Mark who is available to teach",
    },
    {
      href: "/admin/bookings?status=awaiting_payment",
      label: "Confirm payments",
      description: "Mark paid bookings and send invoices",
    },
  ];

  return (
    <div className="admin-dashboard space-y-8">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="See what needs action, what's coming up, and where guests are headed next."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DashboardAttention alerts={alerts} />

      <DashboardUpcomingTrips trips={trips} />

      <DashboardPaymentDeadlines deadlines={paymentDeadlines} />

      <section>
        <h2 className="font-display text-lg font-semibold text-sand">
          Quick actions
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="admin-panel group flex flex-col transition-colors hover:border-teal/35"
            >
              <p className="font-medium text-sand group-hover:text-teal">
                {link.label}
              </p>
              <p className="mt-1 flex-1 text-sm text-sand-muted">
                {link.description}
              </p>
              <ArrowRight
                size={16}
                className="mt-4 text-teal opacity-0 transition-opacity group-hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
