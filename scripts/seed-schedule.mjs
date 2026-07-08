import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional if vars already set
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SLOTS = [
  { service_slug: "discover-freediving", date: "2026-07-12", max_slots: 4, price_cents: 300_000 },
  { service_slug: "discover-freediving", date: "2026-07-19", max_slots: 4, price_cents: 300_000 },
  { service_slug: "discover-freediving", date: "2026-07-26", max_slots: 4, price_cents: 300_000 },
  { service_slug: "practice-dive", date: "2026-07-15", max_slots: 6, price_cents: 300_000 },
  { service_slug: "practice-dive", date: "2026-07-22", max_slots: 6, price_cents: 300_000 },
  { service_slug: "fundive", date: "2026-07-13", max_slots: 8, price_cents: 75_000 },
  { service_slug: "fundive", date: "2026-07-20", max_slots: 8, price_cents: 75_000 },
  { service_slug: "line-training", date: "2026-07-18", max_slots: 4, price_cents: 150_000 },
  { service_slug: "line-training", date: "2026-07-25", max_slots: 4, price_cents: 150_000 },
  { service_slug: "wave-1", date: "2026-08-01", max_slots: 4, price_cents: 1_450_000 },
  { service_slug: "wave-2", date: "2026-08-15", max_slots: 4, price_cents: 1_900_000 },
];

const { data, error } = await supabase
  .from("session_slots")
  .upsert(
    SLOTS.map((s) => ({ ...s, status: "open", booked_count: 0 })),
    { onConflict: "service_slug,date", ignoreDuplicates: true }
  )
  .select();

if (error) {
  console.error("Seed failed:", error.message);
  if (error.message.includes("session_slots")) {
    console.error(
      "\nRun migrations first: supabase/migrations/001_booking_system.sql"
    );
  }
  process.exit(1);
}

console.log(`Seeded ${data?.length ?? SLOTS.length} schedule slots.`);
