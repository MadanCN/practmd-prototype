import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Click on Carmen Rivera appointment card (at 11am in Mitchell column)
const apptCards = await page.$$('.absolute.left-1\\.5.right-1\\.5');
console.log(`Found ${apptCards.length} appointment cards`);
if (apptCards[0]) {
  await apptCards[0].click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshot-appt-detail.png' });
  console.log('✅ appointment detail drawer');
}

// Now click the Cancel button
const cancelBtn = await page.$('button:has-text("Cancel"):not(:has-text("Keep"))');
if (cancelBtn) {
  await cancelBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshot-cancel-modal.png' });
  console.log('✅ cancel modal');

  // Fill reason and submit
  await page.selectOption('select', { value: 'patient-request' });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Cancel Appointment")');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'screenshot-cancel-waitlist.png' });
  console.log('✅ cancel waitlist offers');
}

await browser.close();
console.log('All done.');
