export type UserRole = "admin" | "staff" | "coach" | "instructor";

export type SessionSlotStatus = "open" | "full" | "cancelled";

export type BookingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "expired"
  | "cancelled";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type SiteSettings = {
  id: number;
  qr_pay_image_url: string | null;
  payment_expiry_hours: number;
  updated_at: string;
};

export type SessionSlot = {
  id: string;
  service_slug: string;
  date: string;
  max_slots: number;
  booked_count: number;
  price_cents: number;
  status: SessionSlotStatus;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  session_slot_id: string | null;
  start_date: string | null;
  reference: string;
  payment_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  headcount: number;
  meals_requested: boolean;
  carpool_requested: boolean;
  room_requested: boolean;
  room_decline_reason: string | null;
  trip_duration_days: 1 | 2 | null;
  status: BookingStatus;
  payment_expires_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  approved_by: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  service_slug: string;
  quantity: number;
  participant_names: string[];
  duration_days: 1 | 2;
  unit_price_cents: number;
  start_date: string;
  created_at: string;
};

export type BookingWithSlot = Booking & {
  session_slots: SessionSlot | null;
  booking_items?: BookingItem[];
};

export type Invoice = {
  id: string;
  booking_id: string;
  invoice_number: string;
  pdf_path: string | null;
  sent_at: string | null;
  created_at: string;
};
