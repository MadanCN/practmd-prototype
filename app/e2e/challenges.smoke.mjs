// Challenges smoke test: quick-add a challenge, "Capture advice", save Advice, see the
// advice count and status change (and a second browser see it live), add an Action, pin the advice,
// and check the recap. Everything it creates is deleted at the end.
import { adminClient, assert, BASE_URL, requireEnv, signIn } from "./helpers.mjs";

const ADVISER = "Alex Adviser";

export async function challengesSmoke(browser) {
  const admin = adminClient();
  const email = requireEnv("E2E_EMAIL");
  const title = `E2E challenge ${Date.now()}`;
  const advice = `Hire a product ops lead first (${Date.now()})`;
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const observerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const observer = await observerContext.newPage();
  page.on("pageerror", (e) => console.error("  pageerror:", e.message));

  try {
    console.log("Challenges");
    await signIn(page, email, "/product/challenges");
    await signIn(observer, email, "/product/challenges");

    // --- seeded board
    for (const p of [page, observer]) await p.getByRole("region", { name: "Product and platform" }).waitFor();
    const seeded = await page.locator("[data-challenge-title]").count();
    assert(seeded >= 16, `board shows the seeded challenges (${seeded})`);

    // --- quick add opens the drawer
    const column = page.getByRole("region", { name: "Operations and process" });
    await column.getByLabel("Quick add a challenge").fill(title);
    await column.getByLabel("Quick add a challenge").press("Enter");
    const drawer = page.getByRole("dialog", { name: title });
    await drawer.waitFor();
    assert(true, "quick add creates the challenge and opens it");

    // --- capture advice → advice note → status Discussing
    await drawer.getByRole("button", { name: "Capture advice" }).click();
    const source = page.getByLabel("Source (who said it)");
    await source.fill(ADVISER);
    const body = page.getByRole("textbox", { name: "Note", exact: true });
    await body.focus();
    await body.fill(advice);
    await body.press("Control+Enter");
    await drawer.getByText(advice).waitFor();
    await page.keyboard.press("Escape");

    const card = page.locator(`[data-challenge-title="${title}"]`);
    await card.getByText("Discussing").waitFor({ timeout: 10_000 });
    assert((await card.getByTestId("advice-count").innerText()).trim().startsWith("1"), "card advice count is 1");
    assert(true, "status changed to Discussing");

    // --- second browser sees it live
    const t0 = Date.now();
    const remoteCard = observer.locator(`[data-challenge-title="${title}"]`);
    await remoteCard.getByText("Discussing").waitFor({ timeout: 2_000 });
    await remoteCard.getByTestId("advice-count").filter({ hasText: /^\s*1/ }).waitFor({ timeout: 2_000 });
    assert(true, `second browser sees the new note and status within 2 s (${Date.now() - t0} ms after it appeared here)`);

    // --- action → Action agreed; pin the advice → quoted on the card
    await card.click();
    await drawer.waitFor();
    await drawer.getByRole("button", { name: "Capture advice" }).click();
    assert(await page.getByRole("textbox", { name: "Note", exact: true }).evaluate((el) => el === document.activeElement), "Capture advice focuses the composer");
    assert((await source.inputValue()) === ADVISER, "the last advice source is remembered");
    await page.getByRole("radio", { name: "Action" }).click();
    await page.getByRole("textbox", { name: "Note", exact: true }).fill("Draft the job description");
    await page.getByLabel("Action owner").fill("Biju");
    await page.getByLabel("Action due date").fill("2026-10-15");
    await page.getByRole("button", { name: "Add action" }).click();
    await drawer.getByText("Draft the job description").waitFor();
    await drawer.getByRole("listitem").filter({ hasText: advice }).getByRole("button", { name: "Pin to card" }).click();
    await drawer.getByText("Pinned").waitFor();
    await page.keyboard.press("Escape");
    await card.getByText("Action agreed").waitFor({ timeout: 10_000 });
    assert(true, "adding an Action moves it to Action agreed");
    await card.locator("blockquote").getByText(advice).waitFor();
    assert(true, "pinned advice appears on the card");

    // --- recap lists the advice with its source and the action with owner and due date
    await page.getByRole("button", { name: "Recap" }).click();
    const recap = await page.getByLabel("Recap markdown").inputValue();
    assert(recap.includes(`- **${ADVISER}:** ${advice}`), "recap lists the advice with its source");
    assert(recap.includes("- [ ] Draft the job description — _owner: Biju, due: 15 Oct 2026, open_"), "recap lists the action with owner and due date");
    await page.keyboard.press("Escape");

    // --- deleting a note and the challenge both ask for confirmation
    await card.click();
    await drawer.waitFor();
    await drawer.getByRole("listitem").filter({ hasText: "Draft the job description" }).getByRole("button", { name: "Delete note" }).click();
    const confirmDialog = page.getByRole("dialog", { name: /Delete this action\?/ });
    await confirmDialog.getByRole("button", { name: "Cancel" }).click();
    assert(await drawer.getByText("Draft the job description").isVisible(), "cancelling keeps the note");
    await drawer.getByRole("listitem").filter({ hasText: "Draft the job description" }).getByRole("button", { name: "Delete note" }).click();
    await page.getByRole("dialog", { name: /Delete this action\?/ }).getByRole("button", { name: "Delete note" }).click();
    await drawer.getByText("Draft the job description").waitFor({ state: "detached" });
    assert(true, "confirming deletes the note");

    await drawer.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("dialog", { name: /Delete this challenge\?/ }).getByRole("button", { name: "Delete challenge" }).click();
    await card.waitFor({ state: "detached" });
    const { data: gone } = await admin.from("challenges").select("id").eq("title", title);
    assert(gone.length === 0, "confirming deletes the challenge from the database");
  } finally {
    await admin.from("challenges").delete().eq("title", title);
    await context.close();
    await observerContext.close();
  }
}

export { BASE_URL };
