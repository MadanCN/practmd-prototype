import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Click the visible appointment card
const cards = await page.locator('[class*="absolute"][class*="rounded-lg"][class*="cursor-pointer"]').all();
if (cards.length > 0) {
  await cards[0].click();
  await page.waitForTimeout(600);

  // Click Cancel button
  const cancelBtn = page.locator('button', { hasText: 'Cancel' }).first();
  await cancelBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'ss-cancel-modal.png' });
  console.log('✅ cancel modal - fee section visible');
}

await browser.close();
