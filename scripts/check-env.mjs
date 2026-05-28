#!/usr/bin/env node
/**
 * Validates production-required environment variables (names only — never prints values).
 */
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

const missing = REQUIRED.filter((key) => {
  const v = process.env[key];
  return typeof v !== "string" || !v.trim();
});

if (missing.length > 0) {
  console.error("check-env: missing required variables:");
  for (const key of missing) console.error(`  - ${key}`);
  process.exit(1);
}

console.log(`check-env: ok (${REQUIRED.length} required variables present)`);
