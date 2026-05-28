#!/usr/bin/env node
/**
 * Validates production-required environment variables (names only — never prints values).
 * Rejects placeholder hostnames in public URL env vars.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "NOWPAYMENTS_IPN_SECRET",
  "CRON_SECRET",
  "OPENROUTER_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const PLACEHOLDER_PATTERNS = [
  /example\.com/i,
  /api\.example\.com/i,
  /your-domain\.com/i,
  /^https?:\/\/localhost(?::\d+)?(?:\/|$)/i,
];

function isPlaceholderUrl(raw) {
  if (!raw) return false;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(raw.trim()));
}

const missing = REQUIRED.filter((key) => {
  const v = process.env[key];
  return typeof v !== "string" || !v.trim();
});

const invalid = [];
for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NOWPAYMENTS_IPN_URL"]) {
  const v = process.env[key];
  if (typeof v === "string" && v.trim() && isPlaceholderUrl(v)) {
    invalid.push(`${key} (placeholder URL)`);
  }
}

if (missing.length > 0) {
  console.error("check-env: missing required variables:");
  for (const key of missing) console.error(`  - ${key}`);
}

if (invalid.length > 0) {
  console.error("check-env: invalid placeholder URLs:");
  for (const key of invalid) console.error(`  - ${key}`);
}

if (missing.length > 0 || invalid.length > 0) process.exit(1);

console.log(`check-env: ok (${REQUIRED.length} required variables present, no placeholder URLs)`);

/** Optional: scan src/ for forbidden strings (dev/CI guard). */
const root = process.cwd();
const forbidden = [/example\.com/i, /api\.example\.com/i, /your-domain\.com/i];
const skipDirs = new Set(["node_modules", ".next", ".git"]);
const hits = [];

function scanDir(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (skipDirs.has(name)) continue;
      scanDir(path);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|json|css|html)$/.test(name)) continue;
    const text = readFileSync(path, "utf8");
    for (const re of forbidden) {
      if (re.test(text)) {
        hits.push(`${path.replace(root + "\\", "").replace(root + "/", "")}: ${re}`);
      }
    }
  }
}

try {
  scanDir(join(root, "src"));
  if (hits.length > 0) {
    console.error("check-env: forbidden placeholder URLs in source:");
    for (const h of hits) console.error(`  - ${h}`);
    process.exit(1);
  }
} catch {
  /* non-fatal in CI without src */
}
