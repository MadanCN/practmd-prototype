// Roadmap smoke test: sign in, add an item, see it ranked; move it on the Workstreams board and the
// Timeline; check adjustment validation and RLS. Everything it creates is deleted at the end.
import { createClient } from "@supabase/supabase-js";
import { adminClient, assert, BASE_URL, eventually, requireEnv, signIn } from "./helpers.mjs";

export async function roadmapSmoke(browser) {
  const admin = adminClient();
  const email = requireEnv("E2E_EMAIL");
  const name = `E2E item ${Date.now()}`;
  const code = `e2e${Date.now().toString().slice(-6)}`;
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("  pageerror:", e.message));

  try {
    console.log("Roadmap");
    await signIn(page, email, "/product/priorities");
    await page.getByRole("table").waitFor();

    // --- add item: an adjustment without a reason is rejected by the form
    await page.getByRole("button", { name: "Add item" }).click();
    const sheet = page.getByRole("dialog", { name: "Add roadmap item" });
    await sheet.getByLabel("Name *").fill(name);
    await sheet.getByLabel("Code *").fill(code);
    await sheet.getByLabel("Workstream *").selectOption("revenue_cycle");
    for (const label of ["Revenue impact", "Operational efficiency", "Unlocks", "Ease"]) await sheet.getByLabel(label, { exact: true }).selectOption("4");
    await sheet.getByLabel("Adjustment (−20 to +20)").fill("5");
    await sheet.getByRole("button", { name: "Add item" }).click();
    await sheet.getByText("An adjustment needs a reason of at least 5 characters").waitFor();
    assert(true, "form rejects an adjustment without a reason");
    await sheet.getByLabel("Adjustment (−20 to +20)").fill("0");
    await sheet.getByRole("button", { name: "Add item" }).click();
    await sheet.waitFor({ state: "detached" });

    // --- it appears at its ranked position with score 75 (below the two 78s; unlocks 4 beats Quill's 3)
    const row = page.getByRole("row").filter({ hasText: name });
    await row.waitFor();
    const cells = row.getByRole("cell");
    await cells.nth(7).getByText("75").waitFor({ timeout: 5_000 }).catch(() => {});
    const rank = (await cells.nth(0).innerText()).trim();
    const score = (await cells.nth(7).innerText()).trim();
    assert(score.includes("75"), `new (4,4,4,4) item scores 75 (${score})`);
    assert(rank === "3", `new (4,4,4,4) item ranks #3, below the two 78s and above Quill's 75 (#${rank})`);

    // --- database also rejects an adjustment without a reason (service role bypasses RLS, not CHECKs)
    const { error: checkErr } = await admin.from("roadmap_items").update({ score_adjustment: 5, adjustment_reason: null }).eq("code", code);
    assert(checkErr?.message.includes("adjustment_needs_reason"), "database rejects an adjustment without a reason");

    // --- Workstreams: drag the card from Later to Next, then see Next on Priorities
    await page.goto(`${BASE_URL}/product/workstreams`);
    const card = page.getByRole("button", { name: new RegExp(`^${name}`) });
    await card.waitFor();
    await card.scrollIntoViewIfNeeded();
    const header = page.getByRole("columnheader", { name: "Next", exact: true });
    const cardBox = await card.boundingBox();
    const rowBox = await page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Revenue cycle/ }) }).boundingBox();
    const nextBox = await header.boundingBox();
    await page.mouse.move(cardBox.x + 20, cardBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(cardBox.x + 40, cardBox.y + 20, { steps: 5 });
    await page.mouse.move(nextBox.x + nextBox.width / 2, rowBox.y + 40, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
    await page.goto(`${BASE_URL}/product/priorities`);
    const horizon = page.getByLabel(`Horizon for ${name}`);
    await horizon.waitFor();
    assert((await horizon.inputValue()) === "next", "moving the card to Next updates the Horizon column");

    // --- Timeline: drag from the unscheduled tray onto the grid → bar in the workstream colour
    await page.goto(`${BASE_URL}/product/timeline`);
    // Show only Revenue cycle so its lane and tray group sit side by side.
    for (const ws of ["Foundations", "Patient and intake", "Providers", "Scheduling", "Care delivery", "Cortex AI", "Adoption and outcomes"]) {
      await page.getByRole("group", { name: /^Legend/ }).getByRole("button", { name: ws, exact: true }).click();
    }
    const tray = page.getByRole("button", { name: new RegExp(`^${name}, unscheduled`) });
    await tray.waitFor();
    await tray.scrollIntoViewIfNeeded();
    const trayBox = await tray.boundingBox();
    const lane = page.getByRole("region", { name: "Revenue cycle swimlane" });
    const laneBox = await lane.boundingBox();
    await page.mouse.move(trayBox.x + 20, trayBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(trayBox.x - 20, trayBox.y + 10, { steps: 5 });
    await page.mouse.move(laneBox.x + 210 + 64 * 2 + 20, laneBox.y + 15, { steps: 15 });
    await page.mouse.up();
    const bar = page.getByRole("button", { name: new RegExp(`^${name}\\. Revenue cycle\\.`) });
    await bar.waitFor({ timeout: 10_000 });
    const color = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert(color === "rgb(5, 150, 105)", `dated item moves onto the timeline in its workstream colour (${color})`);
    // The bar shows optimistically; wait for the write to land.
    const dated = await eventually(async () => {
      const { data } = await admin.from("roadmap_items").select("start_date, end_date").eq("code", code).single();
      return data?.start_date ? data : null;
    });
    assert(dated?.start_date?.endsWith("-01") && dated.end_date > dated.start_date, `tray drop saves From/To (${dated?.start_date} → ${dated?.end_date})`);

    // --- removing it from the timeline asks for confirmation and sends it back to the tray
    await page.getByRole("button", { name: `Remove ${name} from the timeline` }).click();
    await page.getByRole("dialog", { name: /Remove from the timeline\?/ }).getByRole("button", { name: "Remove from timeline" }).click();
    await bar.waitFor({ state: "detached" });
    await tray.waitFor();
    const cleared = await eventually(async () => {
      const { data } = await admin.from("roadmap_items").select("start_date").eq("code", code).single();
      return data && data.start_date === null;
    });
    assert(cleared, "remove from timeline (confirmed) clears From/To and returns it to the tray");

    // --- deleting the item asks for confirmation; cancel keeps it, confirm deletes it
    await page.goto(`${BASE_URL}/product/priorities?item=${code}`);
    const drawerDialog = page.getByRole("dialog", { name });
    await drawerDialog.waitFor();
    await drawerDialog.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("dialog", { name: /Delete this item\?/ }).getByRole("button", { name: "Cancel" }).click();
    assert(await drawerDialog.isVisible(), "cancelling the delete keeps the item");
    await drawerDialog.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("dialog", { name: /Delete this item\?/ }).getByRole("button", { name: "Delete item" }).click();
    await page.getByRole("row").filter({ hasText: name }).waitFor({ state: "detached" });
    const deleted = await eventually(async () => {
      const { data } = await admin.from("roadmap_items").select("id").eq("code", code);
      return data?.length === 0;
    });
    assert(deleted, "confirming deletes the item from the database");

    // --- weights: re-rank locally at once, and in a second browser within 2 s
    await assertWeightsLive(browser, page, email);

    // --- viewer role is read-only
    await assertViewerReadOnly(browser, admin);

    // --- RLS: an authenticated user who isn't in app_users reads nothing
    await assertOutsiderReadsNothing(admin);
  } finally {
    // Close the browser first so no pending (debounced) weight save can land after the reset.
    await context.close();
    await admin.from("scoring_weights").update({ w_revenue: 3, w_operational: 3, w_unlocks: 2, w_ease: 2 }).eq("id", 1);
    await admin.from("roadmap_items").delete().eq("code", code);
  }
}

async function assertWeightsLive(browser, page, email) {
  const observerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const observer = await observerContext.newPage();
  try {
    await signIn(observer, email, "/product/priorities");
    await page.goto(`${BASE_URL}/product/priorities`);
    for (const p of [page, observer]) await p.getByRole("table").waitFor();
    const firstScore = (p) => p.getByRole("row").nth(1).getByRole("cell").nth(7);
    assert((await firstScore(page).innerText()).includes("78"), "top score is 78 with Balanced weights");
    const t0 = Date.now();
    // Time from click to the re-ranked DOM, measured inside the page (no test-driver round trips).
    const local = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const cell = () => document.querySelector("tbody tr")?.querySelectorAll("td")[7]?.textContent ?? "";
          const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Revenue first");
          const start = performance.now();
          const obs = new MutationObserver(() => {
            if (cell().includes("85")) {
              obs.disconnect();
              resolve(Math.round(performance.now() - start));
            }
          });
          obs.observe(document.querySelector("tbody"), { subtree: true, childList: true, characterData: true });
          button.click();
        }),
    );
    // 300 ms is the target for the production build; `next dev` is several times slower.
    const budget = Number(process.env.E2E_RERANK_MS ?? 300);
    assert(local < budget, `re-ranks the list in ${local} ms after a weight change (budget ${budget} ms)`);
    await firstScore(observer).getByText("85").waitFor({ timeout: 2_000 + 450 });
    assert(true, `second browser re-ranks within 2 s of the save (${Date.now() - t0} ms after the click, incl. the 450 ms save debounce)`);
    await page.getByRole("button", { name: "Balanced" }).click();
    await firstScore(observer).getByText("78").waitFor({ timeout: 5_000 });
  } finally {
    await observerContext.close();
  }
}

async function assertViewerReadOnly(browser, admin) {
  const viewer = `e2e-viewer-${Date.now()}@example.com`;
  const { data: created, error } = await admin.auth.admin.createUser({ email: viewer, email_confirm: true });
  if (error) throw error;
  await admin.from("app_users").insert({ email: viewer, display_name: "E2E Viewer", role: "viewer" });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    await signIn(page, viewer, "/product/priorities");
    await page.getByRole("table").waitFor();
    assert(await page.getByText("View only").isVisible(), "viewer sees the View only badge");
    assert((await page.getByRole("button", { name: "Add item" }).count()) === 0, "viewer has no Add item button");
    assert((await page.getByRole("combobox").count()) === 0, "viewer has no inline editors");
    await page.goto(`${BASE_URL}/product/challenges`);
    await page.getByRole("region", { name: "Product and platform" }).waitFor();
    assert((await page.getByLabel("Quick add a challenge").count()) === 0, "viewer has no quick add on Challenges");
  } finally {
    await context.close();
    await admin.from("app_users").delete().eq("email", viewer);
    await admin.auth.admin.deleteUser(created.user.id);
  }
}

async function assertOutsiderReadsNothing(admin) {
  const outsider = `e2e-outsider-${Date.now()}@example.com`;
  const { data: created, error } = await admin.auth.admin.createUser({ email: outsider, email_confirm: true });
  if (error) throw error;
  try {
    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: outsider });
    const client = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
    const { error: otpErr } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "email" });
    if (otpErr) throw otpErr;
    for (const table of ["roadmap_items", "roadmap_items_scored", "scoring_weights", "workstreams", "app_users", "challenges", "challenge_notes"]) {
      const { data } = await client.from(table).select("*").limit(5);
      assert((data ?? []).length === 0, `non-member reads nothing from ${table}`);
    }
    const { error: writeErr } = await client.from("roadmap_items").insert({ code: "hack1", name: "Nope nope", workstream: "foundations" });
    assert(!!writeErr, "non-member cannot insert");
    const { data: delItems } = await client.from("roadmap_items").delete().eq("code", "f1").select("id");
    const { data: delChallenges } = await client.from("challenges").delete().not("id", "is", null).select("id");
    assert((delItems ?? []).length === 0 && (delChallenges ?? []).length === 0, "non-member cannot delete items or challenges");
  } finally {
    await admin.auth.admin.deleteUser(created.user.id);
  }
}
