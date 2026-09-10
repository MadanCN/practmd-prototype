import { chromium } from 'playwright';
import path from 'path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

async function shot(url, file, wait = 1200) {
  await page.goto('http://localhost:3000' + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: file });
  console.log('✅ ' + file);
}

await shot('/', 'screenshot-role-selector.png');
await shot('/care-coordinator/appointments/calendar', 'screenshot-cc-calendar.png', 1800);
await shot('/admin', 'screenshot-admin-dashboard.png');
await shot('/care-coordinator/appointments/list', 'screenshot-cc-list.png');
await shot('/care-coordinator/appointments/waitlist', 'screenshot-cc-waitlist.png');
await shot('/care-coordinator/appointments/requests', 'screenshot-cc-requests.png');

// New Appointment drawer open
await page.goto('http://localhost:3000/care-coordinator/appointments/calendar', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.click('button:has-text("New Appointment")');
await page.waitForTimeout(700);
await page.screenshot({ path: 'screenshot-drawer-step1.png' });
console.log('✅ screenshot-drawer-step1.png');

await browser.close();
console.log('All done.');
