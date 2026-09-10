import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const cards = await page.locator('[class*="absolute"][class*="rounded-lg"][class*="cursor-pointer"]').all();
if (cards.length > 0) {
  await cards[0].click();
  await page.waitForTimeout(700);
  // Click Cancel button inside the drawer (has XCircle icon)
  const drawer = page.locator('.fixed.top-0.right-0');
  await drawer.locator('button', { hasText: 'Cancel' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ss-cancel-modal.png' });
  console.log('✅ done');
}
await browser.close();
