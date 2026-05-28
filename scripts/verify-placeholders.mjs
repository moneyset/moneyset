#!/usr/bin/env node
/**
 * Crawl a deployed site and fail if placeholder URLs appear in HTML or linked JS.
 * Usage: node scripts/verify-placeholders.mjs https://moneyset.pro
 */
const base = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const FORBIDDEN = [/example\.com/i, /api\.example\.com/i, /your-domain\.com/i];

function hasForbidden(text) {
  return FORBIDDEN.filter((re) => re.test(text)).map((re) => re.source);
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  return { url, status: res.status, text: await res.text() };
}

async function main() {
  console.log(`verify-placeholders: ${base}\n`);
  const failures = [];

  const home = await fetchText(base);
  const htmlHits = hasForbidden(home.text);
  if (htmlHits.length) failures.push({ where: base, hits: htmlHits });

  const scriptSrcs = [...home.text.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
  const seen = new Set();

  for (const src of scriptSrcs) {
    if (seen.has(src)) continue;
    seen.add(src);
    const js = await fetchText(`${base}${src}`);
    const jsHits = hasForbidden(js.text);
    if (jsHits.length) failures.push({ where: `${base}${src}`, hits: jsHits });
  }

  if (failures.length === 0) {
    console.log(`✓ No placeholder URLs in HTML or ${seen.size} JS chunk(s)`);
    process.exit(0);
  }

  console.error("✗ Placeholder URLs found:");
  for (const f of failures) {
    console.error(`  ${f.where}: ${f.hits.join(", ")}`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
