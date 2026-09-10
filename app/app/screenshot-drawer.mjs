import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// Open drawer and search for a patient
await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.click('button:has-text("New Appointment")');
await page.waitForTimeout(700);

// Type to search
await page.fill('input[placeholder*="name, MRN"]', 'James');
await page.waitForTimeout(400);

// Click the patient result by text
await page.click('button:has-text("James Holloway")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshot-drawer-step1-selected.png' });
console.log('✅ step1 patient selected (rich card)');

// Proceed to step 2 - fill details
await page.click('button:has-text("Continue")');
await page.waitForTimeout(300);
// visit type
const selects = await page.$$('select');
await selects[0].selectOption({ index: 1 });
await page.waitForTimeout(100);
await selects[1].selectOption({ index: 1 });
await page.waitForTimeout(300);
await page.click('button:has-text("Continue")');
await page.waitForTimeout(300);

// Step 3 - pick a date (Monday next week)
await page.fill('input[type="date"]', '2026-06-15');
await page.waitForTimeout(800);
await page.screenshot({ path: 'screenshot-drawer-step3-slots.png' });
console.log('✅ step3 slot grid (available + booked)');

// Click first available slot
const allSlotBtns = await page.$$('.grid.grid-cols-4 button');
for (const btn of allSlotBtns) {
  const disabled = await btn.isDisabled();
  if (!disabled) {
    await btn.click();
    break;
  }
}
await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshot-drawer-step3-selected.png' });
console.log('✅ step3 slot selected (green)');

await browser.close();
console.log('All done.');
