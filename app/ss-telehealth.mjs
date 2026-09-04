import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Scroll to 9am to see morning cards
const scrollable = page.locator('.overflow-auto').first();
await scrollable.evaluate(el => el.scrollTop = 280);
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss-morning.png' });

const cards = await page.locator('[class*="absolute"][class*="rounded-lg"][class*="cursor-pointer"]').all();
console.log(`Cards visible: ${cards.length}`);

// Click on a card that might be telehealth (try each one)
for (let i = 0; i < cards.length; i++) {
  const bb = await cards[i].boundingBox();
  if (!bb) continue;
  await cards[i].click();
  await page.waitForTimeout(500);
  // Check if "Telehealth Session" is visible
  const telehealthSection = await page.locator('text=Telehealth Session').count();
  if (telehealthSection > 0) {
    await page.screenshot({ path: 'ss-telehealth-drawer.png' });
    console.log(`✅ Found telehealth card at index ${i}`);
    break;
  }
  // Close drawer
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
await browser.close();
