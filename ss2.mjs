import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Screenshot 1: Calendar with toggle chips
await page.screenshot({ path: 'ss-calendar-toggles.png' });
console.log('ss1: calendar with toggles');

// Click first appt card using data selector
const cards = await page.locator('[class*="absolute"][class*="rounded-lg"][class*="cursor-pointer"]').all();
console.log(`Found ${cards.length} appt cards`);
if (cards.length > 0) {
  await cards[0].click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'ss-detail.png' });
  console.log('ss2: detail drawer open');

  // Scroll body of drawer to bottom to see timeline
  await page.evaluate(() => {
    const overflows = document.querySelectorAll('.overflow-y-auto');
    for (const el of overflows) el.scrollTop = 9999;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'ss-timeline.png' });
  console.log('ss3: activity timeline');
}

await browser.close();
console.log('Done');
