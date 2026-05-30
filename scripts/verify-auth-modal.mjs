import { chromium } from "playwright";

const pageErrors = [];
const consoleLogs = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("console", (msg) => {
  const text = msg.text();
  if (text.includes("MONEYSET") || text.includes("SITE_URL") || text.includes("auth-modal")) {
    consoleLogs.push(text);
  }
});

await page.addInitScript(() => {
  sessionStorage.setItem("moneyset_tg_institutional_intro_done_v1", "1");
  localStorage.setItem(
    "moneyset_entry_v1",
    JSON.stringify({ state: { entryComplete: true, entryMode: "guest" }, version: 0 })
  );
});

await page.goto("https://moneyset.pro/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(4000);

const accountBtn = page.locator('[aria-label="Account"], [aria-label="Аккаунт"]').first();
await accountBtn.click({ force: true });
await page.waitForTimeout(2000);

const overlays = await page.locator(".ms-modal-overlay, .ms-profile-center__overlay").count();
const body = await page.locator("body").innerText();
const sessionVisible = /Session|Сессия/i.test(body);

console.log("Modal overlays:", overlays);
console.log("Session visible:", sessionVisible);
console.log("SITE_URL errors:", pageErrors.filter((e) => e.includes("SITE_URL")).length);
console.log("Page errors:", pageErrors.join(" | ") || "none");
console.log("Relevant console:", consoleLogs.join("\n") || "none");

await browser.close();
process.exit(overlays > 0 || sessionVisible ? 0 : 1);
