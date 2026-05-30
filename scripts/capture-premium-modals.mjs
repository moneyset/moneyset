#!/usr/bin/env node
/**
 * Capture premium modal screenshots (mobile viewport).
 * Usage: node scripts/capture-premium-modals.mjs [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "premium-screenshots");

const ENTRY_KEY = "moneyset_entry_v1";
const entryDone = JSON.stringify({
  state: { entryComplete: true, entryMode: "guest" },
  version: 0,
});
const entryFresh = JSON.stringify({
  state: { entryComplete: false, entryMode: "unknown" },
  version: 0,
});

async function snap(page, name) {
  await page.waitForTimeout(600);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`saved ${file}`);
  return file;
}

async function dismissDialogs(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
}

async function openUpgradeModal(page) {
  const btn = page.locator(".ms-intel-command__founding-btn").first();
  await btn.click();
}

async function dismissOnboarding(page) {
  if (!(await page.locator(".ms-ob").count())) return;
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: /Continue|Далее/i }).click();
    await page.waitForTimeout(350);
  }
  await page.getByRole("button", { name: /Enter MONEYSET|Войти в MONEYSET/i }).click();
  await page.waitForSelector(".ms-ob", { state: "detached", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
  });

  const shots = [];

  // Onboarding (first-time entry)
  {
    const page = await context.newPage();
    await page.addInitScript((key, val) => localStorage.setItem(key, val), ENTRY_KEY, entryFresh);
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.waitForSelector(".ms-ob--premium", { timeout: 20000 });
    shots.push(await snap(page, "01-onboarding"));
    await page.close();
  }

  // Auth modal
  {
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await dismissOnboarding(page);
    await page.getByRole("button", { name: /Account|Аккаунт/i }).click();
    await page.waitForSelector(".ms-modal-panel--premium", { timeout: 15000 });
    shots.push(await snap(page, "02-auth-modal"));
    await page.close();
  }

  // Profile / account modal
  {
    const page = await context.newPage();
    await page.goto(`${base}/settings`, { waitUntil: "networkidle" });
    await dismissOnboarding(page);
    await page.getByRole("button", { name: /Open account center|Открыть центр аккаунта/i }).click();
    await page.waitForSelector(".ms-profile-center--premium", { timeout: 15000 });
    shots.push(await snap(page, "03-profile-modal"));
    await page.close();
  }

  // Premium access (upgrade) modal
  {
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await dismissOnboarding(page);
    await openUpgradeModal(page);
    await page.waitForSelector(".ms-upgrade-modal--premium", { timeout: 15000 });
    shots.push(await snap(page, "04-upgrade-modal"));
    await page.close();
  }

  // Payment (checkout) modal
  {
    const page = await context.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await dismissOnboarding(page);
    await openUpgradeModal(page);
    await page.waitForSelector(".ms-upgrade-modal--premium", { timeout: 15000 });
    await page.locator(".ms-upgrade-modal--premium .ms-upgrade-modal__cta-primary").click();
    await page.waitForSelector(".ms-checkout-modal--premium", { timeout: 15000 });
    shots.push(await snap(page, "05-checkout-modal"));
    await page.close();
  }

  await browser.close();
  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify({ base, capturedAt: new Date().toISOString(), shots }, null, 2),
  );
  console.log(`\nDone — ${shots.length} screenshots in ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
