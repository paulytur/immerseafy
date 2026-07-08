import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Calendar, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import DashboardUpcomingSummary, {
  type DashboardUpcomingBooking,
} from "@/components/admin/DashboardUpcomingSummary";
import {
  fetchAvailabilityRows,
  groupAvailabilityByDate,
} from "@/lib/coach-availability";
import { formatItemsSummary } from "@/lib/booking-items";
import {
  findNearestUpcomingDate,
  groupAvailabilityByTwoDayPeriod,
} from "@/lib/schedule-utils";
import type { BookingItem, BookingWithSlot } from "@/lib/types";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = todayString();

  const [pending, awaiting, confirmed, bookingsResult, availabilityResult] =
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
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase
        .from("bookings")
        .select("*, booking_items(*)")
        .gte("start_date", today)
        .in("status", ["pending", "awaiting_payment", "confirmed"])
        .order("start_date", { ascending: true }),
      fetchAvailabilityRows(supabase).catch(() => []),
    ]);

  const days = groupAvailabilityByDate(
    availabilityResult as Parameters<typeof groupAvailabilityByDate>[0]
  );
  const periods = groupAvailabilityByTwoDayPeriod(days).filter(
    (period) => period.startDate >= today
  );

  const bookings = (bookingsResult.data ?? []) as BookingWithSlot[];
  const bookingDates = bookings
    .map((booking) => booking.start_date)
    .filter((date): date is string => Boolean(date));

  const nearestDate = findNearestUpcomingDate(periods, bookingDates, today);
  const nearestPeriod = nearestDate
    ? periods.find((period) => period.startDate === nearestDate)
    : null;

  const nearestBookings: DashboardUpcomingBooking[] = nearestDate
    ? bookings
        .filter((booking) => booking.start_date === nearestDate)
        .map((booking) => {
          const items = (booking.booking_items ?? []) as BookingItem[];
          const summary =
            items.length > 0
              ? formatItemsSummary(
                  items.map((item) => ({
                    serviceSlug: item.service_slug,
                    participantNames: item.participant_names,
                    quantity: item.quantity,
                    durationDays: item.duration_days,
                    startDate: item.start_date,
                  }))
                )
              : "Booking";

          return {
            id: booking.id,
            reference: booking.reference,
            customerName: booking.customer_name,
            status: booking.status,
            headcount: booking.headcount,
            summary,
          };
        })
    : [];

  const stats = [
    {
      label: "Pending approval",
      value: pending.count ?? 0,
      href: "/admin/bookings?status=pending",
      icon: Clock,
      accent: "amber" as const,
    },
    {
      label: "Awaiting payment",
      value: awaiting.count ?? 0,
      href: "/admin/bookings?status=awaiting_payment",
      icon: Calendar,
      accent: "teal" as const,
    },
    {
      label: "Confirmed",
      value: confirmed.count ?? 0,
      href: "/admin/bookings?status=confirmed",
      icon: CheckCircle2,
      accent: "emerald" as const,
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
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Track bookings, coach availability, and payments at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DashboardUpcomingSummary
        nearestDate={nearestDate}
        coaches={nearestPeriod?.coaches ?? []}
        bookings={nearestBookings}
      />

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
