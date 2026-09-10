import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// Screenshot 1: Calendar with toggle chips
await page.screenshot({ path: 'ss-calendar-toggles.png' });
console.log('✅ calendar toggles');

// Screenshot 2: Click an appointment to open detail drawer
const apptCards = await page.$$('.absolute.left-1\.5.right-1\.5');
console.log(`Found ${apptCards.length} appointment cards`);
if (apptCards[0]) {
  await apptCards[0].click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'ss-detail-drawer.png' });
  console.log('✅ detail drawer');
  
  // Scroll down to see activity timeline
  const drawer = await page.$('.fixed.top-0.right-0');
  if (drawer) {
    await page.evaluate(() => {
      const body = document.querySelector('.flex-1.overflow-y-auto');
      if (body) body.scrollTop = 9999;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'ss-activity-timeline.png' });
    console.log('✅ activity timeline');
  }
  
  // Click Mark No Show (if available)
  await page.evaluate(() => {
    const body = document.querySelector('.flex-1.overflow-y-auto');
    if (body) body.scrollTop = 0;
  });
  await page.waitForTimeout(200);
  
  // Close detail and open new appointment drawer  
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// Screenshot 3: New appointment drawer - go to step 3 to show waitlist priority
await page.click('button:has-text("New Appointment")');
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss-new-appt-step1.png' });
console.log('✅ new appt step 1');

// Type to search patient
await page.type('input[placeholder*="Search by name"]', 'Carmen');
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss-patient-search.png' });
console.log('✅ patient search');

await browser.close();
console.log('All done.');
