"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminLoading from "@/components/admin/AdminLoading";
import AdminSearch from "@/components/admin/AdminSearch";
import BookingsList from "@/components/admin/BookingsList";
import type { BookingStatus, BookingWithSlot } from "@/lib/types";

function countByStatus(bookings: BookingWithSlot[]) {
  const counts: Record<BookingStatus | "all", number> = {
    all: bookings.length,
    pending: 0,
    awaiting_payment: 0,
    confirmed: 0,
    expired: 0,
    cancelled: 0,
  };

  for (const booking of bookings) {
    counts[booking.status] += 1;
  }

  return counts;
}

function matchesSearch(booking: BookingWithSlot, query: string) {
  if (!query) return true;

  const haystack = [
    booking.customer_name,
    booking.customer_email,
    booking.customer_phone,
    booking.reference,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [bookings, setBookings] = useState<BookingWithSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadBookings();
  }, [loadBookings]);

  const statusCounts = useMemo(() => countByStatus(bookings), [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (statusFilter && booking.status !== statusFilter) return false;
      return matchesSearch(booking, query);
    });
  }, [bookings, statusFilter, search]);

  async function runAction(id: string, action: string) {
    setActing(id);
    setActionMessage(null);

    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      const labels: Record<string, string> = {
        approve: "Payment link sent.",
        reject: "Booking rejected.",
        confirm_payment: "Payment confirmed.",
        cancel: "Booking cancelled.",
      };
      setActionMessage(labels[action] ?? "Updated.");
    } else {
      setActionMessage("Something went wrong. Try again.");
    }

    await loadBookings();
    setActing(null);
  }

  const filters = [
    { value: "", label: "All", href: "/admin/bookings", count: statusCounts.all },
    {
      value: "pending",
      label: "Pending",
      href: "/admin/bookings?status=pending",
      count: statusCounts.pending,
    },
    {
      value: "awaiting_payment",
      label: "Awaiting",
      href: "/admin/bookings?status=awaiting_payment",
      count: statusCounts.awaiting_payment,
    },
    {
      value: "confirmed",
      label: "Confirmed",
      href: "/admin/bookings?status=confirmed",
      count: statusCounts.confirmed,
    },
    {
      value: "expired",
      label: "Expired",
      href: "/admin/bookings?status=expired",
      count: statusCounts.expired,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      href: "/admin/bookings?status=cancelled",
      count: statusCounts.cancelled,
    },
  ];

  return (
    <div className="admin-bookings-page space-y-3">
      <AdminPageHeader
        eyebrow="Reservations"
        title="Bookings"
        description="Review, approve, and confirm payments."
      />

      <div className="admin-filter-panel admin-filter-panel-sticky">
        <div className="admin-filter-panel-tabs">
          <AdminFilterTabs
            tabs={filters}
            active={statusFilter}
            embedded
          />
        </div>

        <div className="admin-filter-panel-fields admin-filter-panel-fields-single">
          <AdminSearch
            label="Search"
            value={search}
            onChange={setSearch}
            placeholder="Name, email, phone, or reference"
          />
        </div>
      </div>

      {actionMessage ? (
        <p className="admin-bookings-toast" role="status">
          {actionMessage}
        </p>
      ) : null}

      {loading ? (
        <AdminLoading label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="No bookings yet"
          description="New booking requests will appear here."
        />
      ) : filteredBookings.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardList}
          title="No bookings match"
          description={
            search
              ? "Try a different search or clear the filter."
              : "Try a different status filter."
          }
        />
      ) : (
        <BookingsList
          bookings={filteredBookings}
          acting={acting}
          onAction={runAction}
          groupByMonth={!statusFilter}
        />
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <BookingsContent />
    </Suspense>
  );
}
