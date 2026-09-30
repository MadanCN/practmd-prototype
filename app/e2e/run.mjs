// Runs the Product smoke tests against a running app (npm run dev, or E2E_BASE_URL for a deploy).
// Usage: npm run test:e2e            (reads .env / .env.local)
import { chromium } from "playwright";
import { BASE_URL } from "./helpers.mjs";
import { roadmapSmoke } from "./roadmap.smoke.mjs";
import { challengesSmoke } from "./challenges.smoke.mjs";

const suites = { roadmap: roadmapSmoke, challenges: challengesSmoke };
const selected = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(suites);

console.log(`Smoke tests against ${BASE_URL}\n`);
const browser = await chromium.launch();
let failed = 0;
for (const name of selected) {
  try {
    await suites[name](browser);
    console.log(`✔ ${name}\n`);
  } catch (e) {
    failed++;
    console.error(`✘ ${name}: ${e.message}\n`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
