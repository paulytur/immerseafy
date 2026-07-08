#!/usr/bin/env node
/**
 * Restore default coach roster after an overly broad data wipe.
 * Usage: node scripts/restore-coaches.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DEFAULT_COACHES = [
  { name: "Paul Yturzaita", slug: "paul-yturzaita" },
  { name: "Dominic Rivera", slug: "dominic-rivera" },
  { name: "J-lyn Guevarra", slug: "j-lyn-guevarra" },
  { name: "Zed Tanjista", slug: "zed-tanjista" },
  { name: "Lance Dusaban", slug: "lance-dusaban" },
];

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

async function main() {
  const { data, error } = await supabase
    .from("coaches")
    .upsert(
      DEFAULT_COACHES.map((coach) => ({ ...coach, active: true })),
      { onConflict: "slug" }
    )
    .select("name, slug");

  if (error) {
    console.error("Failed to restore coaches:", error.message);
    process.exit(1);
  }

  console.log(`Restored ${data?.length ?? 0} coach(es):`);
  for (const coach of data ?? []) {
    console.log(`  - ${coach.name} (${coach.slug})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
