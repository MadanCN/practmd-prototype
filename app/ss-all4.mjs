import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// 1. Calendar - visit type colors
await page.screenshot({ path: 'ss-visit-colors.png' });
console.log('ss1: calendar visit-type colors');

// 2. Open detail drawer for a telehealth appointment (a03 is telehealth)
// Scroll up to see morning appointments
const body = page.locator('.overflow-auto').first();
await body.evaluate(el => el.scrollTop = 0);
await page.waitForTimeout(300);
const cards = await page.locator('[class*="absolute"][class*="rounded-lg"][class*="cursor-pointer"]').all();
console.log(`Found ${cards.length} cards`);
// Click a card
if (cards.length > 0) {
  await cards[0].click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'ss-detail-telehealth.png' });
  console.log('ss2: detail drawer');
  
  // Open cancel modal
  const drawer = page.locator('.fixed.top-0.right-0');
  await drawer.locator('button', { hasText: 'Cancel' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'ss-cancel-no-checkbox.png' });
  console.log('ss3: cancel modal no checkbox');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
await browser.close();
