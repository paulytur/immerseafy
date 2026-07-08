#!/usr/bin/env node
/**
 * Clear booking + scheduling data only.
 * Keeps: coaches, team accounts, site settings, services (in code).
 * Usage: node scripts/wipe-booking-scheduling-data.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteAll(table, options = {}) {
  const { dateColumn = "created_at", idColumn = "id" } = options;
  let query = supabase.from(table).delete({ count: "exact" });

  if (dateColumn) {
    query = query.gte(dateColumn, "1970-01-01");
  } else {
    query = query.not(idColumn, "is", null);
  }

  const { error, count } = await query;

  if (error) {
    console.error(`Failed to clear ${table}:`, error.message);
    process.exit(1);
  }

  console.log(`Cleared ${table}: ${count ?? 0} row(s)`);
}

async function clearInvoiceStorage() {
  const { data: files, error } = await supabase.storage.from("invoices").list("", {
    limit: 1000,
  });

  if (error) {
    console.warn("Could not list invoice files:", error.message);
    return;
  }

  if (!files?.length) {
    console.log("No invoice files in storage.");
    return;
  }

  const paths = files.map((file) => file.name).filter(Boolean);
  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage.from("invoices").remove(paths);
  if (removeError) {
    console.warn("Could not remove some invoice files:", removeError.message);
    return;
  }

  console.log(`Removed ${paths.length} invoice file(s) from storage.`);
}

async function main() {
  console.log("Clearing bookings and scheduling data only…");

  await deleteAll("invoices");
  await deleteAll("booking_item_slots", { dateColumn: null });
  await deleteAll("booking_items");
  await deleteAll("bookings");
  await deleteAll("session_slots");
  await deleteAll("coach_availability");
  await clearInvoiceStorage();

  console.log("Done. Coaches, team accounts, and site settings were kept.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
