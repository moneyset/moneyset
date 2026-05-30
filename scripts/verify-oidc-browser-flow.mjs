/** Browser-level OIDC start flow (no Telegram credentials). */
import { chromium } from "playwright";

const base = process.argv[2] ?? "https://moneyset.pro";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`${base}/auth`, { waitUntil: "networkidle", timeout: 120_000 });
const link = page.locator('a[href*="/api/auth/telegram/oidc/start"]');
const count = await link.count();
const href = count ? await link.first().getAttribute("href") : null;

let oauthReached = false;
let finalUrl = page.url();

if (href) {
  await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  finalUrl = page.url();
  oauthReached = finalUrl.includes("oauth.telegram.org");
}

console.log(
  JSON.stringify(
    {
      oidcLinkOnAuthPage: count > 0,
      oidcLinkCount: count,
      href,
      navigatesToTelegramOAuth: oauthReached,
      finalUrl: finalUrl.slice(0, 160),
    },
    null,
    2,
  ),
);

await browser.close();
process.exit(oauthReached ? 0 : 1);
