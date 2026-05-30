/** Verify billing status auth behavior on production. */
const base = process.argv[2] ?? "https://moneyset.pro";

const anon = await fetch(`${base}/api/billing/status?invoiceId=test-invoice`, {
  cache: "no-store",
});
const anonJson = await anon.json();
console.log("Anonymous GET /api/billing/status:");
console.log("  status:", anon.status);
console.log("  body:", JSON.stringify(anonJson));

const badBearer = await fetch(`${base}/api/billing/status?invoiceId=test-invoice`, {
  headers: { Authorization: "Bearer invalid-token" },
  cache: "no-store",
});
const badJson = await badBearer.json();
console.log("\nInvalid Bearer GET /api/billing/status:");
console.log("  status:", badBearer.status);
console.log("  body:", JSON.stringify(badJson));

process.exit(anon.status === 401 ? 0 : 1);
