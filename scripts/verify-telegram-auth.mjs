/** Production Telegram auth verification (no secrets required). */
import { chromium } from "playwright";

const base = process.argv[2] ?? "https://moneyset.pro";

async function get(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text, headers: res.headers };
}

const results = {};

// 1. Health / env
const health = await get("/api/health");
results.health = {
  ok: health.json?.ok === true,
  envOk: health.json?.env?.ok === true,
  missing: health.json?.env?.missing ?? [],
  invalid: health.json?.env?.invalid ?? [],
  telegramAuthSecretPresent: !(health.json?.env?.missing ?? []).includes("TELEGRAM_AUTH_SECRET"),
  telegramBotTokenPresent: !(health.json?.env?.missing ?? []).includes("TELEGRAM_BOT_TOKEN"),
  siteUrlPresent: !(health.json?.env?.missing ?? []).includes("NEXT_PUBLIC_SITE_URL"),
};

// 2. Mini App endpoint initialization
const tgNoInit = await get("/api/auth/telegram", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
results.miniAppEndpoint = {
  reachable: tgNoInit.status !== 404 && tgNoInit.status !== 503,
  botConfigured: tgNoInit.status !== 503,
  missingInitDataReturns400: tgNoInit.status === 400 && tgNoInit.json?.error === "Missing initData",
};

const tgInvalid = await get("/api/auth/telegram", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ initData: "user=%7B%22id%22%3A1%7D&hash=deadbeef", source: "verify" }),
});
results.miniAppVerify = {
  invalidInitReturns401: tgInvalid.status === 401,
  error: tgInvalid.json?.error ?? null,
};

// 3. OIDC login routes
const oidcStart = await fetch(`${base}/api/auth/telegram/oidc/start?next=/`, { redirect: "manual" });
const oidcStartLocation = oidcStart.headers.get("location") ?? "";
results.telegramOidc = {
  startReachable: oidcStart.status >= 300 && oidcStart.status < 400,
  redirectsToTelegramOAuth: oidcStartLocation.includes("oauth.telegram.org/auth"),
  usesClientId: oidcStartLocation.includes("client_id="),
  usesPkce: oidcStartLocation.includes("code_challenge="),
  redirectUri: "https://moneyset.pro/api/auth/telegram/oidc/callback",
};

// Legacy widget callback (deprecated)
const widgetCb = await fetch(`${base}/api/auth/telegram/callback?next=/`, { redirect: "manual" });
const location = widgetCb.headers.get("location") ?? "";
results.loginWidgetCallback = {
  reachable: widgetCb.status >= 300 && widgetCb.status < 400,
  invalidParamsRedirectToAuth: location.includes("/auth?error="),
  errorCode: new URL(location, base).searchParams.get("error"),
};

// 4. Browser checks: widget mount + auth modal
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.addInitScript(() => {
  sessionStorage.setItem("moneyset_tg_institutional_intro_done_v1", "1");
  localStorage.setItem(
    "moneyset_entry_v1",
    JSON.stringify({ state: { entryComplete: true, entryMode: "guest" }, version: 0 }),
  );
});

await page.goto(`${base}/auth`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);

const widgetScript = page.locator('[data-ms-telegram-login-widget]');
const oidcButton = page.locator('[data-ms-telegram-login-widget]');
results.loginWidgetClient = {
  authPageLoads: true,
  oidcButtonPresent: (await oidcButton.count()) > 0,
  oidcStartUrl: await page
    .locator('[data-ms-telegram-login-widget]')
    .getAttribute("href")
    .catch(() => null),
  legacyWidgetScriptInjected: (await page.locator('script[src*="telegram-widget.js"]').count()) > 0,
};

// Open auth modal from home
await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(3000);
try {
  await page.locator('[aria-label="Account"], [aria-label="Аккаунт"]').first().click({ force: true, timeout: 5000 });
  await page.waitForTimeout(2000);
  results.authModal = {
    opens: (await page.locator(".ms-modal-overlay").count()) > 0,
    widgetInModal: (await page.locator(".ms-modal-overlay [data-ms-telegram-login-widget]").count()) > 0,
  };
} catch {
  results.authModal = { opens: false, widgetInModal: false, note: "Account button not clickable in headless run" };
}

await browser.close();

// 5. Bot domain (indirect)
results.botDomain = {
  expectedDomain: "moneyset.pro",
  oidcRedirectUri: "https://moneyset.pro/api/auth/telegram/oidc/callback",
  oidcAllowedOrigin: "https://moneyset.pro",
  botFatherWebLogin: "Bot Settings → Web Login → add Redirect URI above + Allowed URL https://moneyset.pro",
  legacyWidgetDeprecated: true,
};

// 6. Remaining blockers
const blockers = [];
if (!results.health.telegramAuthSecretPresent) blockers.push("TELEGRAM_AUTH_SECRET missing in production env");
if (!results.health.telegramBotTokenPresent) blockers.push("TELEGRAM_BOT_TOKEN missing");
if (!results.miniAppEndpoint.botConfigured) blockers.push("Mini App endpoint returns 503 (bot not configured)");
if (!results.telegramOidc.startReachable) blockers.push("OIDC start route not reachable");
if (!results.telegramOidc.redirectsToTelegramOAuth) blockers.push("OIDC start does not redirect to oauth.telegram.org");
if (results.loginWidgetClient.legacyWidgetScriptInjected)
  blockers.push("Legacy telegram-widget.js still injected — migrate to OIDC button");
if (!results.loginWidgetClient.oidcButtonPresent)
  blockers.push("OIDC login button missing — set NEXT_PUBLIC_TELEGRAM_OIDC_CLIENT_ID");
if (!results.authModal.opens) blockers.push("Auth modal does not open from Account button");
results.remainingBlockers = blockers;

console.log(JSON.stringify(results, null, 2));
process.exit(blockers.length ? 1 : 0);
