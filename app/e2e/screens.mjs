// Dev aid: signs in and screenshots each Product tab into e2e/.screens/ (git-ignored).
// Usage: node --env-file=.env e2e/screens.mjs [tab ...]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { BASE_URL, requireEnv, signIn } from "./helpers.mjs";

const tabs = process.argv.slice(2).length ? process.argv.slice(2) : ["priorities", "workstreams", "timeline", "challenges"];
const dark = process.env.SCREENS_DARK === "1";
mkdirSync("e2e/.screens", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: Number(process.env.SCREENS_WIDTH ?? 1280), height: 860 }, colorScheme: dark ? "dark" : "light" });
const page = await context.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));
page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
await signIn(page, requireEnv("E2E_EMAIL"));
if (dark) await page.evaluate(() => localStorage.setItem("theme", "dark"));
for (const tab of tabs) {
  await page.goto(`${BASE_URL}/product/${tab}`, { waitUntil: "networkidle" });
  await page
    .waitForFunction(() => !document.body.innerText.includes("Loading…") && !document.querySelector(".animate-pulse"), null, { timeout: 25_000 })
    .catch(() => console.error("still loading after 25s:", tab));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `e2e/.screens/${tab}${dark ? "-dark" : ""}.png`, fullPage: false });
  console.log("shot", tab, "scrollWidth", await page.evaluate(() => document.documentElement.scrollWidth));
}
await browser.close();
